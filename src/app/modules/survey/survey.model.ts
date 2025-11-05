import { Schema, model } from "mongoose";
import "../question/question.model"; // Ensure Question model is registered
import {
  ISurveyResponse,
  SurveyResponseModel,
  TUser,
} from "./survey.interface";

const userSchema = new Schema<TUser>({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  department: {
    type: String,
    enum: [
      "Human Resources",
      "Senior Management",
      "it",
      "finance",
      "marketing",
      "engineering",
      "operations",
      "research",
      "customer",
      "legal",
      "administration",
      "other",
    ],
    required: true,
    trim: true,
  },
  gender: { type: String, enum: ["male", "female", "other"], required: true },
  age: {
    type: String,
    enum: ["18-24", "25-34", "35-44", "45-54"],
    required: true,
    trim: true,
  },
  seniorityLevel: {
    type: String,
    enum: ["senior", "manager", "employee"],
    required: true,
    trim: true,
  },
  location: {
    type: String,
    enum: ["block60", "msusundam", "headOffice"],
    required: true,
    trim: true,
  },
});

const answerSchema = new Schema({
  question: { type: Schema.Types.ObjectId, ref: "questions", required: true },
  answerIndex: { type: Number, required: true },
  score: { type: Number, required: true },
});

const domainRiskSchema = new Schema({
  domain: { type: String, required: true },
  riskCount: { type: Number, default: 0 },
});

const surveyResponseSchema = new Schema<ISurveyResponse, SurveyResponseModel>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    user: { type: userSchema, required: true },
    responses: [answerSchema],
    questions: [{ type: Schema.Types.ObjectId, ref: "questions" }],
    highRiskCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    completedAt: { type: Date },
    followUpQuestions: [{ type: Schema.Types.ObjectId, ref: "questions" }],
    domainRisks: [domainRiskSchema],
  },
  { timestamps: true }
);

export const SurveyResponse = model<ISurveyResponse, SurveyResponseModel>(
  "SurveyResponse",
  surveyResponseSchema
);
