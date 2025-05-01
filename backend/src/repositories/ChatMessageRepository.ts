import { PrismaClient, MessageType}  from '@prisma/client'
import { PagingDto } from '../dtos/PagingDto';

const prisma = new PrismaClient();

export class ChatMessageRepository {

	async sendMessage(
		senderId: number, receiverId: number, content: string, type: MessageType) 
	{
		return prisma.chatMessage.create({
			data: {senderId, receiverId, content, type}
		});
	}

	async getConversation(userA: number, userB: number, paging: PagingDto) 
	{
		const { limit = 50, lastId, lastCreatedAt} = paging;
		return prisma.chatMessage.findMany({
			where: {
				OR: [
					{ senderId: userA, receiverId: userB},
					{ senderId: userB, receiverId: userA}
				]
			},
			orderBy: [
				{ createdAt: 'asc'},
				{ id: 'asc'}
			],
			take: limit,
			...((lastId !== undefined && lastCreatedAt !== undefined) 
				? { cursor: {createdAt_id: {createdAt: lastCreatedAt, id: lastId}}, skip: 1} 
				: {})
		});
	}

	async markAsRead(messageIds: number[]){
		return prisma.chatMessage.updateMany({
			where: { id: { in: messageIds }}, 
			data: { isRead: true}
		})
	}

	async getUnread(receiverId: number, paging: PagingDto) 
	{
		const { limit = 50, lastId, lastCreatedAt} = paging;
		return prisma.chatMessage.findMany({
			where: { receiverId, isRead: false},
			orderBy: [
				{ createdAt: 'asc'},
				{ id: 'asc'}
			],
			take: limit,
			...((lastId !== undefined && lastCreatedAt !== undefined) 
				? { cursor : {createdAt_id: {createdAt: lastCreatedAt, id: lastId}}, skip: 1}
				: {})
		});
	}
}