import { ToDoAccess } from "./todosAcess";
import { createLogger } from '../utils/logger';

const logger = createLogger('Log from Todos.ts')
const toDoAccess = new ToDoAccess();
const s3BucketName = process.env.S3_BUCKET_NAME;

// TODO: Implement the fileStogare logic
export async function removeImageInS3(id: string): Promise<void> {
  logger.info(`Removiong Image id: ${id} in S3 bucket: ${s3BucketName}`)

  return toDoAccess.removeImageInS3(id);
}

export function generateUploadUrl(todoId: string, userId: string): Promise<string> {
  logger.info(`Generating uploadUrl of todoId: ${todoId}}`)

  return toDoAccess.generateUploadUrl(todoId, userId);
}