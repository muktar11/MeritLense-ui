export type UserType = "B2C" | "B2B" | "ADMIN";

export interface User {
  email: string;
  userType: UserType;
  fullName?: string;
}