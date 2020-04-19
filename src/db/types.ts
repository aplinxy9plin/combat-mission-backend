import {Collection as MgCollection} from 'mongodb';

/**
 * Пара ключ - заголовок.
 */
interface IdTitlePair {
  id: number;
  title: string;
}

/**
 * Список всех возможных коллекций в проекте.
 */
export enum Collection {
  Achievements = 'achievements',
  Games = 'games',
  Users = 'users',
  Ranks = 'ranks',
  Stages = 'stages',
  Teams = 'teams',
}

/**
 * Список возможных промокодов.
 */
export enum PromoCodeType {
  Discount20VipFrom2Hours = 'discount 20 percents in VIP if duration more than 2 hrs',
}

/**
 * Список существующих достижений.
 */
export enum AchievementEnum {
  TeamPlayer,
  Visitor,
  Correspondent,
  LivingFullLife,
  Warrior,
  RichSoul,
  BorderGuard,
}

/**
 * Ранг который присуждается пользователю.
 */
export interface Rank {
  name: string;
  minPoints: number;
  imageUrl: string;
}

export interface UserClosedPromoCode {
  id: string;
  type: PromoCodeType;
  title: string;
  openedAt: null;
  expiresAt: Date;
}

export interface UserOpenedPromoCode {
  id: string;
  type: PromoCodeType;
  title: string;
  value: string;
  openedAt: Date;
  expiresAt: Date;
}

export interface PromoCode {
  id: string;
  type: PromoCodeType;
  title: string;
  value: string;
  openedAt: Date | null;
  expiresAt: Date;
}

export type UserPromoCode = UserOpenedPromoCode | UserClosedPromoCode;

export type Game = IdTitlePair;
export type Stage = IdTitlePair;

export interface Profile {
  age: number;
  about: string | null;
  city: string;
  clubId: number;
  games: Game[];
  playTime: number;
  stage: Stage;
}

export interface User {
  achievementsReceived: IAchievement[];
  achievementsProgress: Record<AchievementEnum, number | null>;
  activatedChecks: string[];
  avatarUrl: string | null;
  id: number;
  promoCodes: PromoCode[];
  profile: Profile | null;
  points: number;
  rank: Rank | null;
  lastFixedVisitDate: number;
  nextRank: Rank | null;
  visitsInRow: number;
}

export interface TeamUser {
  id: number;
  avatarUrl: string | null;
}

export interface Team {
  _id: any;
  users: TeamUser[];
}

export interface IAchievement {
  id: AchievementEnum;
  iconImageUrl: string;
  title: string;
  description: string;
  points: number[] | null;
  rankPoints: number[] | null;
  storyImageUrls: string[];
  snippetImageUrls: string[];
}

// Описание типов данных в каждой из коллекций
export interface DbSchema {
  [Collection.Achievements]: IAchievement;
  [Collection.Games]: Game;
  [Collection.Users]: User;
  [Collection.Ranks]: Rank;
  [Collection.Stages]: Stage;
  [Collection.Teams]: Team;
}

export type TDbSchemaKey = keyof DbSchema;
export type TDbSchemaValues = DbSchema[TDbSchemaKey];
export type TDbSchemaCollection = MgCollection<TDbSchemaValues>;
