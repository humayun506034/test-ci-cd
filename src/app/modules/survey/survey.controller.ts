import httpStatus from "http-status";

import { SurveyService } from "./survey.service";
import catchAsync from "../../utils/catch_async";
import sendResponse from "../../utils/sendResponse";
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  loggedInUser?: any;
}
const startSurvey = catchAsync(async (req, res) => {
  const { organizationId } = req.params;
  console.log(organizationId);
  const result = await SurveyService.startSurvey({ ...req.body });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Survey started successfully",
    data: result,
  });
});

const submitAnswer = catchAsync(async (req, res) => {
  const { surveyId } = req.params;
  const result = await SurveyService.submitAnswer(surveyId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Answer submitted successfully",
    data: result,
  });
});

const getSurveyResult = catchAsync(async (req, res) => {
  const { surveyId } = req.params;
  const result = await SurveyService.getSurveyResult(surveyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Survey result fetched successfully",
    data: result,
  });
});
const getAllServeysResult = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;

  // const {status}= req.query

  const result = await SurveyService.getAllServeysResult(
    status as "completed" | "in-progress",
    page as any,
    limit as any
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Survey result fetched successfully",
    data: result,
  });
});
const getSingleOrganizationServays = catchAsync(async (req:AuthenticatedRequest, res) => {
  console.log('req.params', req.params)
  // const { status, page, limit } = req.query;

  // console.log(req.loggedInUser)

  // const {status}= req.query

  const result = await SurveyService.getSingleOrganizationServays(
    // req.loggedInUser._id
    req.params.organizationId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Survey results fetched successfully",
    data: result,
  });
});


// const getOrganizationSurveyStats = catchAsync(async (req:AuthenticatedRequest, res) => {

//   const result = await SurveyService.getOrganizationSurveyStats(
//     req.params.organizationId
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Survey results fetched successfully",
//     data: result,
//   });
// })

const getOrganizationSurveyStats = catchAsync(async (req, res) => {
  const { organizationId } = req.params; // Extract organizationId from params

  // Extract filters from query params
  const filters = {
    unitDepartment: req.query.unitDepartment as string | undefined,
    gender: req.query.gender as "male" | "female" | "other" | undefined,
    age: req.query.age as "18-24" | "25-34" | "35-44" | "45-54" | undefined,
    location: req.query.location as "block60" | "msusundam" | "headOffice" | undefined,
    seniorityLevel: req.query.seniorityLevel as "senior" | "manager" | "employee" | undefined,
  };

  // Call the service function with organizationId and filters
  const result = await SurveyService.getOrganizationSurveyStats(organizationId, filters);

  // Send the response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Survey results fetched successfully",
    data: result,
  });
});

export const SurveyController = {
  startSurvey,
  submitAnswer,
  getSurveyResult,
  getAllServeysResult,
  getSingleOrganizationServays,
  getOrganizationSurveyStats
};
