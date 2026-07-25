import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Note } from './note.entity';
import { CreateNoteDto, UpdateNoteDto } from './note.dto';

@Injectable()
export class NotesService {
  constructor(@InjectRepository(Note) private repo: Repository<Note>) {}

  findByLesson(userId: string, lessonId: string, search?: string): Promise<Note[]> {
    return this.repo.find({
      where: {
        userId,
        lessonId,
        ...(search ? { content: ILike(`%${search}%`) } : {}),
      },
      order: { timestamp: 'ASC' },
    });
  }

  findByUser(userId: string, search?: string): Promise<Note[]> {
    return this.repo.find({
      where: {
        userId,
        ...(search ? { content: ILike(`%${search}%`) } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  create(userId: string, lessonId: string, dto: CreateNoteDto): Promise<Note> {
    return this.repo.save(this.repo.create({ userId, lessonId, ...dto }));
  }

  async update(id: string, userId: string, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException();
    return this.repo.save({ ...note, ...dto });
  }

  async remove(id: string, userId: string): Promise<void> {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(note);
  }
}
