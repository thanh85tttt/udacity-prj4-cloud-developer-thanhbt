import {TodoItem} from "../models/TodoItem";
import {CreateTodoRequest} from "../requests/CreateTodoRequest";
import {UpdateTodoRequest} from "../requests/UpdateTodoRequest";
import {TodoUpdate} from "../models/TodoUpdate";
import { ToDoAccess } from "./todosAcess";
import { createLogger } from '../utils/logger';

const logger = createLogger('Log from Todos.ts')
const uuidv4 = require('uuid/v4');
const toDoAccess = new ToDoAccess();

export async function getAllToDo(userId: string): Promise<TodoItem[]> {
    logger.info(`Getting all todos for user: ${userId}`)
    return toDoAccess.getAllToDo(userId);
}

export function createToDo(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem> {
    logger.info(`Creating new todo for user: ${userId}`)
    const todoId =  uuidv4();
    
    const newTodo: TodoItem = {
        userId: userId,
        todoId: todoId,
        attachmentUrl:  "",
        createdAt: new Date().getTime().toString(),
        done: false,
        ...createTodoRequest,
    }
    
    return toDoAccess.createToDo(newTodo);
}

export function updateToDo(updateTodoRequest: UpdateTodoRequest, todoId: string, userId: string): Promise<TodoUpdate> {
    logger.info(`Updating todo: ${todoId} of user: ${userId}`)

    return toDoAccess.updateToDo(updateTodoRequest, todoId, userId);
}

export async function deleteToDo(todoId: string, userId: string): Promise<string> {
    logger.info(`Deleting todo: ${todoId} of user: ${userId}`)
    const item = await toDoAccess.getTodoItemByKeySchema(todoId, userId);

    logger.info(`Checking auth of todo: ${todoId} for: user ${userId}`)
    if (!item) throw new Error(`Todo item of ${todoId} is not exist !`) 
    logger.info(`Check auth of todo: ${todoId} for: user ${userId} : SUCCESS !`)

    return toDoAccess.deleteToDo(todoId, userId);
}

