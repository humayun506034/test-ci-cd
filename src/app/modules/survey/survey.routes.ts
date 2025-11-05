// import express from 'express';

// import { SurveyController } from './survey.controller';
// import validateRequest from '../../middlewares/validateSchema';

// const router = express.Router();

// router.get(
//   '/',
//   SurveyController.getAllServeysResult,
// );

// router.post(
//   '/start',
//   SurveyController.startSurvey,
// );

// router.get(
//   '/organization/:organizationId',
//   SurveyController.getSingleOrganizationServays,
// );

// router.post(
//   '/:surveyId/submit',
//   SurveyController.submitAnswer,
// );

// router.get(
//   '/:surveyId/result',
//   SurveyController.getSurveyResult,
// );

// export const SurveyRoutes = router;

import express from "express";
import { SurveyController } from "./survey.controller";
import validateOrganization from "../../middlewares/validateOrganization";

const router = express.Router();

router.get("/", SurveyController.getAllServeysResult);

router.post("/start", SurveyController.startSurvey);

// router.get(
//   "/get-single-organization-servays",
//   validateOrganization(),
//   SurveyController.getSingleOrganizationServays
// );
router.get(
  "/organization/:organizationId",
  // validateOrganization(),
  SurveyController.getSingleOrganizationServays
);

router.get(
  "/organization/:organizationId/stats",
  // validateOrganization(),
  SurveyController.getOrganizationSurveyStats
);

router.post("/:surveyId/submit", SurveyController.submitAnswer);

router.get("/:surveyId/result", SurveyController.getSurveyResult);

export const SurveyRoutes = router;
