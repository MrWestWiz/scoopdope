export enum ContentType {
  COURSE = 'course',
  POST = 'post',
  REPLY = 'reply',
  REVIEW = 'review',
}

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  APPEALED = 'appealed',
  HIDDEN = 'hidden',
}

export enum ModerationAction {
  FLAG = 'flag',
  APPROVE = 'approve',
  REJECT = 'reject',
  AUTO_HIDE = 'auto_hide',
  APPEAL_SUBMITTED = 'appeal_submitted',
  APPEAL_APPROVED = 'appeal_approved',
  APPEAL_REJECTED = 'appeal_rejected',
}
