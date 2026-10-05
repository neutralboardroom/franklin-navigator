-- Franklin Navigator R1366 promotional-document extension.
-- Keeps the existing reviewed media table and permits safe PDF documents in addition to normalized WebP images.
alter table franklin_member_promotion_media
  drop constraint if exists franklin_member_promotion_media_mime_type_check;

alter table franklin_member_promotion_media
  add constraint franklin_member_promotion_media_mime_type_check
  check (mime_type in ('image/webp','application/pdf'));
