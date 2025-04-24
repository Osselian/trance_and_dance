export interface TournamentCreateDto {
		name: string;
		description?: string;
		startDate: Date;
		endDate: Date;
}