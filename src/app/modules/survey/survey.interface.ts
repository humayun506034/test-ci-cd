import { Model, Types } from "mongoose";

export const ageRanges = ["18-25", "25-34", "35-44", "44-54"] as const;
export const seniorityLevels = [
  "Senior Management",
  "Manager / Team Lead",
  "Employee / Individual Contributor",
] as const;
export const locations = ["Block 60", "Msusundam", "Head Office"] as const;

export type TUser = {
  organizationId: Types.ObjectId;
  department:
    | "Human Resources"
    | "Senior Management"
    | "it"
    | "finance"
    | "marketing"
    | "engineering"
    | "operations"
    | "research"
    | "customer"
    | "legal"
    | "administration"
    | "other";
  gender: "male" | "female" | "other";
  age: "18-24" | "25-34" | "35-44" | "45-54";
  seniorityLevel: "senior" | "manager" | "employee";
  location: "block60" | "msusundam" | "headOffice";
};




export type TAnswer = {
  question: Types.ObjectId;
  answerIndex: number;
  score: number;
};

export type TDomainRisk = {
  domain: string;
  riskCount: number;
};

export interface ISurveyResponse {
  organizationId: Types.ObjectId;
  user: TUser;
  responses: TAnswer[];
  questions: Types.ObjectId[];
  followUpQuestions: Types.ObjectId[];
  highRiskCount: number;
  status: "in-progress" | "completed";
  completedAt?: Date;
  domainRisks: TDomainRisk[];
}

export type SurveyResponseModel = Model<
  ISurveyResponse,
  Record<string, unknown>
>;
