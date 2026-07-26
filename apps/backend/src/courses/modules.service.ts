import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseModule } from './course-module.entity';

@Injectable()
export class ModulesService {
  constructor(@InjectRepository(CourseModule) private repo: Repository<CourseModule>) {}

  private withLockStatus(mod: CourseModule): CourseModule & { isLocked: boolean } {
    const isLocked = mod.releaseDate != null && new Date(mod.releaseDate) > new Date();
    return { ...mod, isLocked };
  }

  async findByCourse(courseId: string) {
    const modules = await this.repo.find({ where: { courseId }, order: { order: 'ASC' } });
    return modules.map((m) => this.withLockStatus(m));
  }

  async findOne(id: string) {
    const mod = await this.repo.findOne({ where: { id } });
    return mod ? this.withLockStatus(mod) : null;
  }

  /** Check if a module is accessible. Admins/instructors bypass the lock. */
  async assertAccessible(id: string, role?: string): Promise<void> {
    const mod = await this.repo.findOne({ where: { id } });
    if (!mod) throw new NotFoundException('Module not found');
    if (role === 'admin' || role === 'instructor') return;
    if (mod.releaseDate && new Date(mod.releaseDate) > new Date()) {
      throw new ForbiddenException(`Module is locked until ${mod.releaseDate.toISOString()}`);
    }
  }

  create(courseId: string, data: Partial<CourseModule>) {
    return this.repo.save(this.repo.create({ ...data, courseId }));
  }

  async update(id: string, data: Partial<CourseModule>) {
    const mod = await this.repo.findOne({ where: { id } });
    if (!mod) throw new NotFoundException('Module not found');
    return this.withLockStatus(await this.repo.save({ ...mod, ...data }));
  }

  async remove(id: string) {
    const mod = await this.repo.findOne({ where: { id } });
    if (!mod) throw new NotFoundException('Module not found');
    return this.repo.remove(mod);
  }

  /** Admin override: clear the release date to unlock immediately. */
  async unlockNow(id: string) {
    const mod = await this.repo.findOne({ where: { id } });
    if (!mod) throw new NotFoundException('Module not found');
    mod.releaseDate = null;
    return this.withLockStatus(await this.repo.save(mod));
  }

  /** Find modules whose releaseDate just passed (within the last minute). Used by the scheduler. */
  findJustUnlocked(): Promise<CourseModule[]> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60_000);
    return this.repo
      .createQueryBuilder('m')
      .where('m.releaseDate <= :now', { now })
      .andWhere('m.releaseDate > :oneMinuteAgo', { oneMinuteAgo })
      .getMany();
  }
}
