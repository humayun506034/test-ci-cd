import { questionModel } from "./../question/question.model";
import httpStatus from "http-status";

import { TUser } from "./survey.interface";
import { SurveyResponse } from "./survey.model";
import { AppError } from "../../utils/app_error";
import { nextTick } from "process";
import { paginate } from "../../utils/paginate";
import { organizationModel } from "../organization/organization.model";
import { Types } from "mongoose";

// const startSurvey = async (payload: TUser) => {
//   const dashboardDomains = [
//     // "Clinical Risk Index",
//     // "Psychological Safety Index",
//     // "Satisfaction & Engagement",

//     "Clinical Risk Index",
//     "Psychological Safety Index",
//     "Workload & Efficiency",
//     "Leadership & Alignment",
//     "Satisfaction & Engagement",
//   ];

//   const randomDomain =
//     dashboardDomains[Math.floor(Math.random() * dashboardDomains.length)];

//   const questions = await questionModel.aggregate([
//     { $match: { isFollowUp: false, dashboardDomain: randomDomain } },
//     { $sample: { size: 5 } },
//   ]);

//   if (questions.length < 5)
//     throw new AppError(
//       "Not enough questions in the database to start the survey.",
//       httpStatus.INTERNAL_SERVER_ERROR
//     );

//   const surveyData = {
//     user: payload,
//     questions: questions.map((q) => q._id), // 5 main questions assigned
//     followUpQuestions: [],
//     responses: [],
//     highRiskCount: 0,
//     status: "in-progress",
//   };

//   const survey = await SurveyResponse.create(surveyData);

//   return {
//     survey,
//     nextQuestion: questions[0],
//   };
// };

// // ===== submitAnswer.ts =====
// const submitAnswer = async (
//   surveyId: string,
//   payload: { questionId: string; answerIndex: number }
// ) => {
//   const { questionId, answerIndex } = payload;

//   const survey = await SurveyResponse.findById(surveyId).populate(
//     "questions followUpQuestions"
//   );

//   if (!survey) throw new AppError("Survey not found.", httpStatus.NOT_FOUND);
//   if (survey.status === "completed")
//     throw new AppError(
//       "This survey has already been completed.",
//       httpStatus.BAD_REQUEST
//     );

//   // Prevent duplicate answer
//   if (survey.responses.some((res) => res.question.toString() === questionId))
//     throw new AppError(
//       "This question has already been answered.",
//       httpStatus.BAD_REQUEST
//     );

//   // Find question object
//   const question =
//     survey.questions.find((q: any) => q._id.toString() === questionId) ||
//     (survey.followUpQuestions.find(
//       (q: any) => q._id.toString() === questionId
//     ) as any);

//   if (!question)
//     throw new AppError("Question not found.", httpStatus.NOT_FOUND);

//   // Score calculation
//   const score = question.isInverted
//     ? question.options.length - answerIndex
//     : answerIndex + 1;

//   // Update high-risk count
//   if (!survey.highRiskCount) survey.highRiskCount = 0;
//   if (!question.isInverted) {
//     if (answerIndex <= 1) survey.highRiskCount += 1;
//   } else {
//     if (answerIndex >= 2) survey.highRiskCount += 1;
//   }

//   // Save response
//   survey.responses.push({ question: questionId as any, answerIndex, score });

//   // Add follow-up questions if high-risk
//   if (
//     survey.highRiskCount >= 2 &&
//     survey.followUpQuestions.length === 0 &&
//     question.isFollowUp === false
//   ) {
//     const followUps = await questionModel.find({
//       isFollowUp: true,
//       dashboardDomain: question.dashboardDomain,
//     });
//     survey.followUpQuestions = followUps.map((q) => q._id) as any;
//   }

//   // Determine next question sequentially
//   const allQuestions = [...survey.questions, ...survey.followUpQuestions];
//   const answeredCount = survey.responses.length;
//   let nextQuestion = null;

//   if (answeredCount < allQuestions.length) {
//     nextQuestion = await questionModel.findById(allQuestions[answeredCount]);
//   } else {
//     survey.status = "completed";
//     survey.completedAt = new Date();
//   }

//   await survey.save();

//   return {
//     survey,
//     nextQuestion,
//   };
// };

const startSurvey = async (payload: TUser) => {
  console.log(payload);

  const isOrganizationExist = await organizationModel.findById(
    payload.organizationId
  );

  if (!isOrganizationExist) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }
  const dashboardDomains = [
    "Clinical Risk Index",
    "Psychological Safety Index",
    "Workload & Efficiency",
    "Leadership & Alignment",
    "Satisfaction & Engagement",
  ];

  // Fetch all non-follow-up questions for all domains
  const questions = await questionModel.find({
    isFollowUp: false,
    dashboardDomain: { $in: dashboardDomains },
  });

  if (questions.length === 0) {
    throw new AppError(
      "No questions found for any domain.",
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }

  const surveyData = {
    organization: payload.organizationId,
    user: payload,
    questions: questions.map((q) => q._id),
    followUpQuestions: [],
    responses: [],
    domainRisks: dashboardDomains.map((domain) => ({ domain, riskCount: 0 })), // Initialize risk count for each domain
    status: "in-progress",
  };

  const survey = await SurveyResponse.create(surveyData);

  return {
    survey,
    nextQuestion: questions[0],
  };
};

// ===== submitAnswer =====
const submitAnswer = async (
  surveyId: string,
  payload: { questionId: string; answerIndex: number }
) => {
  const { questionId, answerIndex } = payload;

  const survey = await SurveyResponse.findById(surveyId).populate(
    "questions followUpQuestions"
  );

  if (!survey) {
    throw new AppError("Survey not found.", httpStatus.NOT_FOUND);
  }
  if (survey.status === "completed") {
    throw new AppError(
      "This survey has already been completed.",
      httpStatus.BAD_REQUEST
    );
  }

  if (survey.responses.some((res) => res.question.toString() === questionId)) {
    throw new AppError(
      "This question has already been answered.",
      httpStatus.BAD_REQUEST
    );
  }

  const question = await questionModel.findById(questionId);

  if (!question) {
    throw new AppError("Question not found.", httpStatus.NOT_FOUND);
  }

  // Score calculation
  const score = question.isInverted
    ? question.options.length - answerIndex
    : answerIndex + 1;

  // Update high-risk count for the question's domain
  const dashboardDomains = [
    "Clinical Risk Index",
    "Psychological Safety Index",
    "Workload & Efficiency",
    "Leadership & Alignment",
    "Satisfaction & Engagement",
  ];
  const domainRisk = survey.domainRisks.find(
    (dr) => dr.domain === question.dashboardDomain
  );
  if (domainRisk) {
    if (!survey.highRiskCount) {
      survey.highRiskCount = 0;
    }

    if (!question.isInverted) {
      if (answerIndex <= 1) {
        domainRisk.riskCount += 1;
        survey.highRiskCount += 1;
      }
    } else {
      if (answerIndex >= 2) {
        domainRisk.riskCount += 1;
        survey.highRiskCount += 1;
      }
    }
  }

  // Save response
  survey.responses.push({ question: questionId as any, answerIndex, score });

  let nextQuestion = null;

  // Check if all main questions have been answered
  if (survey.responses.length >= survey.questions.length) {
    // All main questions answered, now check for follow-ups
    const riskyDomains = survey.domainRisks
      .filter((dr) => dr.riskCount >= 2)
      .map((dr) => dr.domain);

    if (riskyDomains.length > 0) {
      const followUps = await questionModel.find({
        isFollowUp: true,
        dashboardDomain: { $in: riskyDomains },
      });

      survey.followUpQuestions = followUps.map((q) => q._id);

      // Find the next unanswered follow-up question
      const answeredFollowUpIds = new Set(
        survey.responses.map((r) => r.question.toString())
      );
      const nextFollowUp = followUps.find(
        (q) => !answeredFollowUpIds.has(q._id.toString())
      );

      if (nextFollowUp) {
        nextQuestion = nextFollowUp;
      } else {
        // This case should ideally not be hit if there are follow-ups, but as a fallback
        survey.status = "completed";
        survey.completedAt = new Date();
      }
    } else {
      // No risky domains, complete the survey
      survey.status = "completed";
      survey.completedAt = new Date();
    }
  } else {
    // Still main questions to answer
    const nextQuestionId = survey.questions[survey.responses.length];
    nextQuestion = await questionModel.findById(nextQuestionId);
  }

  // Additional check for follow-up questions if main questions are done
  if (survey.responses.length > survey.questions.length) {
    const answeredFollowUpIds = new Set(
      survey.responses.map((r) => r.question.toString())
    );
    const allFollowUps = await questionModel.find({
      _id: { $in: survey.followUpQuestions },
    });
    const nextFollowUp = allFollowUps.find(
      (q) => !answeredFollowUpIds.has(q._id.toString())
    );

    if (nextFollowUp) {
      nextQuestion = nextFollowUp;
    } else {
      survey.status = "completed";
      survey.completedAt = new Date();
    }
  }

  await survey.save();

  return {
    survey,
    nextQuestion,
  };
};

const getSurveyResult = async (surveyId: string) => {
  const survey = await SurveyResponse.findById(surveyId)
    .populate("questions")
    .populate("followUpQuestions")
    .populate("responses.question");

  if (!survey) {
    throw new AppError("Survey not found", httpStatus.NOT_FOUND);
  }

  if (survey.status !== "completed") {
    throw new AppError("Survey not completed", httpStatus.BAD_REQUEST);
  }

  const dashboardDomains = [
    "Clinical Risk Index",
    "Psychological Safety Index",
    "Workload & Efficiency",
    "Leadership & Alignment",
    "Satisfaction & Engagement",
  ];

  const domainResults: { [key: string]: any } = {};

  for (let i = 0; i < dashboardDomains.length; i++) {
    const domain = dashboardDomains[i];
    const domainResponses = survey.responses.filter(
      (res: any) => res.question.dashboardDomain === domain
    );

    const calculatedWeightedRaw = domainResponses.map((res: any) => {
      const question = res.question as any;
      const weight = question.weight;
      const score = res.score;
      return (weight / 100) * score;
    });

    const totalWRS = calculatedWeightedRaw.reduce((acc, cur) => acc + cur, 0);

    const firstQuestionOfDomain = survey.questions.find(
      (q: any) => q.dashboardDomain === domain
    ) as any;

    const domainMaxPossibleScore =
      firstQuestionOfDomain?.dashboardDomainMaxPossibleScore || 1;

    const domainScore = ((1 - totalWRS / domainMaxPossibleScore) * 100).toFixed(
      4
    );
    const healthyScore = totalWRS / domainMaxPossibleScore;

    const domainRisk = survey.domainRisks.find((dr) => dr.domain === domain);

    domainResults[domain] = {
      riskCount: domainRisk ? domainRisk.riskCount : 0,
      totalWRS,
      domainScore,
      healthyScore,
      responses: domainResponses,
    };
  }

  return {
    survey,
    domainResults,
  };
};

const getAllServeysResult = async (
  status?: "completed" | "in-progress",
  page?: number,
  limit?: number
) => {
  const currentPage = page && page > 0 ? page : 1;
  const perPage = limit && limit > 0 ? limit : 10;

  let filter: Record<string, any> = {};
  if (status) {
    filter.status = status;
  }

  const skip = (currentPage - 1) * perPage;

  const surveysQuery = SurveyResponse.find(filter)
    .select("user highRiskCount status organizationId")
    .skip(skip)
    .limit(perPage);

  const [
    surveys,
    totalFilteredSurveys,
    totalCompletedSurveys,
    totalIncompletedSurveys,
    totalSurverys,
    completedSurveys,
  ] = await Promise.all([
    surveysQuery,
    SurveyResponse.countDocuments(filter),
    SurveyResponse.countDocuments({ status: "completed" }),
    SurveyResponse.countDocuments({ status: "in-progress" }),
    SurveyResponse.countDocuments(),
    SurveyResponse.find({ status: "completed" }).select("highRiskCount"),
  ]);

  let avgHighRiskCount = 0;
  if (completedSurveys.length > 0) {
    const totalHighRiskCount = completedSurveys.reduce(
      (acc, survey) => acc + (survey.highRiskCount || 0),
      0
    );
    avgHighRiskCount = totalHighRiskCount / completedSurveys.length;
  }

  const domainStats = await SurveyResponse.aggregate([
    { $unwind: "$domainRisks" },
    {
      $group: {
        _id: "$domainRisks.domain",
        totalRiskCount: { $sum: "$domainRisks.riskCount" },
      },
    },
  ]);

  const riskySurveysCount = await SurveyResponse.countDocuments({
    "domainRisks.riskCount": { $gte: 2 },
  });

  return {
    data: {
      surveys,
      statistics: {
        totalSurverys,
        totalCompletedSurveys,
        totalIncompletedSurveys,
        avgHighRiskCount,
        domainStats,
        riskySurveysCount,
      },
    },
    meta: {
      page: currentPage,
      limit: perPage,
      totalFiltered: totalFilteredSurveys,
      totalPages: Math.ceil(totalFilteredSurveys / perPage),
    },
  };
};
const getSingleOrganizationServays = async (organizationId: string) => {
  const isOrganizationExist = await organizationModel.findById(organizationId);

  if (!isOrganizationExist) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }
  const result = await SurveyResponse.find({
    "user.organizationId": organizationId,
  });

  return result;
};

// const getOrganizationSurveyStats = async (organizationId: string) => {
//   const isOrganizationExist = await organizationModel.findById(organizationId);
//   if (!isOrganizationExist) {
//     throw new AppError("Organization not found", httpStatus.NOT_FOUND);
//   }

//   const result = await SurveyResponse.aggregate([
//     { $match: { "user.organizationId": new Types.ObjectId(organizationId), status: "completed" } },

//     {
//       $facet: {
//         // --- Mental Health Metrics ---
//         mentalHealthMetrics: [
//           { $unwind: "$domainRisks" },
//           {
//             $group: {
//               _id: "$domainRisks.domain",
//               avgRisk: { $avg: "$domainRisks.riskCount" },
//             },
//           },
//           {
//             $project: {
//               _id: 0,
//               domain: "$_id",
//               avgRisk: { $round: ["$avgRisk", 1] },
//               riskLevel: {
//                 $switch: {
//                   branches: [
//                     { case: { $lte: ["$avgRisk", 10] }, then: "low risk" },
//                     { case: { $and: [{ $gt: ["$avgRisk", 10] }, { $lte: ["$avgRisk", 20] }] }, then: "medium risk" },
//                   ],
//                   default: "high risk",
//                 },
//               },
//             },
//           },
//         ],

//         // --- Demographics (Age Distribution) ---
//         ageDistribution: [
//           {
//             $group: {
//               _id: "$user.age",
//               count: { $sum: 1 },
//             },
//           },
//           {
//             $project: {
//               _id: 0,
//               ageGroup: "$_id",
//               people: "$count",
//             },
//           },
//         ],

//         // --- Gender Distribution ---
//         genderDistribution: [
//           {
//             $group: {
//               _id: "$user.gender",
//               count: { $sum: 1 },
//             },
//           },
//           {
//             $project: {
//               _id: 0,
//               gender: "$_id",
//               people: "$count",
//             },
//           },
//         ],

//         // --- Department Breakdown ---
//         departmentStats: [
//           {
//             $group: {
//               _id: "$user.department",
//               total: { $sum: 1 },
//               avgHighRisk: { $avg: "$highRiskCount" },
//             },
//           },
//           {
//             $project: {
//               _id: 0,
//               department: "$_id",
//               totalResponses: "$total",
//               avgHighRisk: { $round: ["$avgHighRisk", 1] },
//             },
//           },
//         ],
//       },
//     },
//   ]);

//   return result[0];
// };


// const DOMAIN_HIGH_RISK_THRESHOLD = 10; // domain.riskCount > 10 => domain considered high risk

// const updateDemographicMap = (
//   map: Map<string, { people: number; sumHighRiskCount: number; highRiskRespondentCount: number }>,
//   key: string,
//   surveyHighRiskCount: number
// ) => {
//   if (!map.has(key)) {
//     map.set(key, { people: 0, sumHighRiskCount: 0, highRiskRespondentCount: 0 });
//   }
//   const entry = map.get(key);
//   if (entry) {
//     entry.people += 1;
//     entry.sumHighRiskCount += surveyHighRiskCount;
//     if (surveyHighRiskCount > 0) {
//       entry.highRiskRespondentCount += 1;
//     }
//   }
// };

// const getOrganizationSurveyStats = async (organizationId: string) => {
//   // 1. validate organization
//   const isOrganizationExist = await organizationModel.findById(organizationId);
//   if (!isOrganizationExist) {
//     throw new AppError("Organization not found", httpStatus.NOT_FOUND);
//   }

//   // 2. fetch all completed survey responses for the organization
//   const responses = await SurveyResponse.find({
//     "user.organizationId": new Types.ObjectId(organizationId),
//     status: "completed",
//   }).lean();

//   if (responses.length === 0) {
//     return {
//       success: true,
//       message: "No survey responses found for this organization.",
//       data: {
//         totalParticipants: 0,
//         mentalHealthMetrics: [],
//         ageStats: [],
//         genderStats: [],
//         departmentStats: [],
//       },
//     };
//   }

//   // 3. total participants
//   let totalParticipants = 0;
//   totalParticipants = responses.length;

//   // prepare containers
//   const domainStatsMap = new Map<
//     string,
//     { sumRisk: number; surveyCount: number; highRiskCount: number }
//   >();

//   const ageMap = new Map<
//     string,
//     { people: number; sumHighRiskCount: number; highRiskRespondentCount: number }
//   >();

//   const genderMap = new Map<
//     string,
//     { people: number; sumHighRiskCount: number; highRiskRespondentCount: number }
//   >();

//   const departmentMap = new Map<
//     string,
//     { people: number; sumHighRiskCount: number; highRiskRespondentCount: number }
//   >();

//   // 4. iterate responses and accumulate
//   for (let i = 0; i < responses.length; i++) {
//     const resp = responses[i];
//     // console.log(resp)

//     // ---- domainRisks accumulation ----
//     const domainRisks = resp.domainRisks || [];
//     for (let j = 0; j < domainRisks.length; j++) {
//       const dr = domainRisks[j];
//       const domainName = dr.domain;
//       const riskCount = dr.riskCount;

//       if (domainStatsMap.has(domainName) === false) {
//         domainStatsMap.set(domainName, {
//           sumRisk: 0,
//           surveyCount: 0,
//           highRiskCount: 0,
//         });
//       }

//       const current = domainStatsMap.get(domainName);
//       if (current) {
//         current.sumRisk = current.sumRisk + riskCount;
//         current.surveyCount = current.surveyCount + 1;

//         if (riskCount > DOMAIN_HIGH_RISK_THRESHOLD) {
//           current.highRiskCount = current.highRiskCount + 1;
//         }
//       }
//     }

//     // ---- demographic accumulation ----
//     const surveyHighRiskCount = typeof resp.highRiskCount === "number" ? resp.highRiskCount : 0;

//     updateDemographicMap(ageMap, resp.user?.age || "unknown", surveyHighRiskCount);
//     updateDemographicMap(genderMap, resp.user?.gender || "unknown", surveyHighRiskCount);
//     updateDemographicMap(departmentMap, resp.user?.department || "unknown", surveyHighRiskCount);
//   } // end responses loop

//   // 5. build mentalHealthMetrics array from domainStatsMap
//   const mentalHealthMetrics: Array<any> = [];
//   const domainKeys = Array.from(domainStatsMap.keys());
//   for (let i = 0; i < domainKeys.length; i++) {
//     const domainName = domainKeys[i];
//     console.log(domainName)
//     const stats = domainStatsMap.get(domainName);
//     console.log(stats)
//     if (stats === undefined) {
//       continue;
//     }

//     let avgRisk = 0;
//     if (stats.surveyCount > 0) {
//       avgRisk = stats.sumRisk / stats.surveyCount;
//     }

//     // round to 1 decimal
//     const avgRiskRounded = Math.round(avgRisk * 10) / 10;

//     // risk level
//     let riskLevel = "high risk";
//     if (avgRiskRounded <= 10) {
//       riskLevel = "low risk";
//     } else if (avgRiskRounded <= 20) {
//       riskLevel = "medium risk";
//     }

//     // satisfaction = 100 - avgRisk (clamped between 0 and 100)
//     let satisfactionScore = 100 - avgRiskRounded;
//     if (satisfactionScore < 0) {
//       satisfactionScore = 0;
//     }
//     if (satisfactionScore > 100) {
//       satisfactionScore = 100;
//     }
//     const satisfactionRounded = Math.round(satisfactionScore * 10) / 10;

//     const surveyCountForDomain = stats.surveyCount;
//     const highRiskCountForDomain = stats.highRiskCount;
//     const nonHighRiskCountForDomain = surveyCountForDomain - highRiskCountForDomain;

//     mentalHealthMetrics.push({
//       domain: domainName,
//       avgRisk: avgRiskRounded,
//       riskPercent: avgRiskRounded,
//       riskLevel: riskLevel,
//       surveyCount: surveyCountForDomain,
//       highRiskCount: highRiskCountForDomain,
//       nonHighRiskCount: nonHighRiskCountForDomain,
//       satisfactionScore: satisfactionRounded,
//     });
//   }

//   // 6. build ageStats
//   const ageStats: Array<any> = [];
//   const ageKeys = Array.from(ageMap.keys());
//   for (let i = 0; i < ageKeys.length; i++) {
//     const ageKey = ageKeys[i];
//     const entry = ageMap.get(ageKey);
//     if (entry === undefined) {
//       continue;
//     }

//     const people = entry.people;
//     let peoplePercent = 0;
//     if (totalParticipants > 0) {
//       peoplePercent = (people / totalParticipants) * 100;
//     }
//     const peoplePercentRounded = Math.round(peoplePercent * 10) / 10;

//     let avgRiskForAge = 0;
//     if (people > 0) {
//       avgRiskForAge = entry.sumHighRiskCount / people;
//     }
//     const avgRiskForAgeRounded = Math.round(avgRiskForAge * 10) / 10;

//     let satisfactionForAge = 100 - avgRiskForAgeRounded;
//     if (satisfactionForAge < 0) {
//       satisfactionForAge = 0;
//     }
//     if (satisfactionForAge > 100) {
//       satisfactionForAge = 100;
//     }
//     const satisfactionForAgeRounded = Math.round(satisfactionForAge * 10) / 10;

//     const surveyCount = people;
//     const highRiskCount = entry.highRiskRespondentCount;
//     const nonHighRiskCount = surveyCount - highRiskCount;

//     ageStats.push({
//       ageGroup: ageKey,
//       people: people,
//       peoplePercent: peoplePercentRounded,
//       riskScore: avgRiskForAgeRounded,
//       satisfactionScore: satisfactionForAgeRounded,
//       surveyCount: surveyCount,
//       highRiskCount: highRiskCount,
//       nonHighRiskCount: nonHighRiskCount,
//     });
//   }

//   // 7. build genderStats
//   const genderStats: Array<any> = [];
//   const genderKeys = Array.from(genderMap.keys());
//   for (let i = 0; i < genderKeys.length; i++) {
//     const g = genderKeys[i];
//     const entry = genderMap.get(g);
//     if (entry === undefined) {
//       continue;
//     }

//     const people = entry.people;
//     let peoplePercent = 0;
//     if (totalParticipants > 0) {
//       peoplePercent = (people / totalParticipants) * 100;
//     }
//     const peoplePercentRounded = Math.round(peoplePercent * 10) / 10;

//     let avgRiskForGender = 0;
//     if (people > 0) {
//       avgRiskForGender = entry.sumHighRiskCount / people;
//     }
//     const avgRiskForGenderRounded = Math.round(avgRiskForGender * 10) / 10;

//     let satisfactionForGender = 100 - avgRiskForGenderRounded;
//     if (satisfactionForGender < 0) {
//       satisfactionForGender = 0;
//     }
//     if (satisfactionForGender > 100) {
//       satisfactionForGender = 100;
//     }
//     const satisfactionForGenderRounded = Math.round(satisfactionForGender * 10) / 10;

//     const surveyCount = people;
//     const highRiskCount = entry.highRiskRespondentCount;
//     const nonHighRiskCount = surveyCount - highRiskCount;

//     genderStats.push({
//       gender: g,
//       people: people,
//       peoplePercent: peoplePercentRounded,
//       riskScore: avgRiskForGenderRounded,
//       satisfactionScore: satisfactionForGenderRounded,
//       surveyCount: surveyCount,
//       highRiskCount: highRiskCount,
//       nonHighRiskCount: nonHighRiskCount,
//     });
//   }

//   // 8. build departmentStats
//   const departmentStats: Array<any> = [];
//   const deptKeys = Array.from(departmentMap.keys());
//   for (let i = 0; i < deptKeys.length; i++) {
//     const d = deptKeys[i];
//     const entry = departmentMap.get(d);
//     if (entry === undefined) {
//       continue;
//     }

//     const people = entry.people;
//     let departmentPercent = 0;
//     if (totalParticipants > 0) {
//       departmentPercent = (people / totalParticipants) * 100;
//     }
//     const departmentPercentRounded = Math.round(departmentPercent * 10) / 10;

//     let avgRiskForDept = 0;
//     if (people > 0) {
//       avgRiskForDept = entry.sumHighRiskCount / people;
//     }
//     const avgRiskForDeptRounded = Math.round(avgRiskForDept * 10) / 10;

//     let satisfactionForDept = 100 - avgRiskForDeptRounded;
//     if (satisfactionForDept < 0) {
//       satisfactionForDept = 0;
//     }
//     if (satisfactionForDept > 100) {
//       satisfactionForDept = 100;
//     }
//     const satisfactionForDeptRounded = Math.round(satisfactionForDept * 10) / 10;

//     const surveyCount = people;
//     const highRiskCount = entry.highRiskRespondentCount;
//     const nonHighRiskCount = surveyCount - highRiskCount;

//     departmentStats.push({
//       department: d,
//       totalResponses: surveyCount,
//       departmentPercent: departmentPercentRounded,
//       avgRisk: avgRiskForDeptRounded,
//       satisfactionScore: satisfactionForDeptRounded,
//       highRiskCount: highRiskCount,
//       nonHighRiskCount: nonHighRiskCount,
//     });
//   }

//   // 9. final response
//   return {
//     success: true,
//     message: "Organization survey statistics fetched successfully",
//     data: {
//       totalParticipants: totalParticipants,
//       mentalHealthMetrics: mentalHealthMetrics,
//       ageStats: ageStats,
//       genderStats: genderStats,
//       departmentStats: departmentStats,
//     },
//   };
// };


const DOMAIN_HIGH_RISK_THRESHOLD = 5;   // for larger raw scales
const SCORE5_HIGH_RISK_THRESHOLD = 3.5;  // for 0..5 raw scales (tune if needed)

// risk badge driven by avgRisk (float, NOT percent)
const RISK_LEVEL = { LOW_MAX: 10, MEDIUM_MAX: 20 };

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */
const clamp0100 = (x: number) => Math.max(0, Math.min(100, x));
const pct = (part: number, total: number) =>
  total ? Math.round(((part / total) * 100) * 10) / 10 : 0;

const updateDemographicMap = (
  map: Map<string, { people: number; sumHighRiskCount: number; highRiskRespondentCount: number }>,
  key: string,
  surveyHighRiskCount: number
) => {
  if (!map.has(key)) {
    map.set(key, { people: 0, sumHighRiskCount: 0, highRiskRespondentCount: 0 });
  }
  const entry = map.get(key)!;
  entry.people += 1;
  entry.sumHighRiskCount += surveyHighRiskCount;
  if (surveyHighRiskCount > 0) entry.highRiskRespondentCount += 1;
};

/* -------------------------------------------------------
   Service (drop-in)
   - avgRisk = float average of raw riskCount (NOT percent)
   - riskPercent = % of entries above high-risk threshold (0..100)
   - Dynamic domain threshold: <=5 ⇒ 3.5 else 10
   - Organization lookup from both organizationId and user.organizationId
------------------------------------------------------- */
export const getOrganizationSurveyStats = async (
  organizationId: string,
  filters: {
    unitDepartment?: string;
    gender?: "male" | "female" | "other";
    age?: "18-24" | "25-34" | "35-44" | "45-54";
    location?: "block60" | "msusundam" | "headOffice";
    seniorityLevel?: "senior" | "manager" | "employee";
  } = {}
) => {
  // 1) validate org
  const isOrganizationExist = await organizationModel.findById(organizationId);
  if (!isOrganizationExist) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  // 2) robust org query (ObjectId or string; top-level or nested)
  const orClauses: any[] = [];
  if (Types.ObjectId.isValid(organizationId)) {
    const oid = new Types.ObjectId(organizationId);
    orClauses.push({ organizationId: oid }, { "user.organizationId": oid });
  }
  orClauses.push({ organizationId }, { "user.organizationId": organizationId });

  const query: any = { $or: orClauses, status: "completed" };

  // Optional filters -> user.*
  if (filters.unitDepartment) query["user.department"] = filters.unitDepartment;
  if (filters.gender) query["user.gender"] = filters.gender;
  if (filters.age) query["user.age"] = filters.age;
  if (filters.location) query["user.location"] = filters.location;
  if (filters.seniorityLevel) query["user.seniorityLevel"] = filters.seniorityLevel;

  // 3) fetch responses
  const responses = await SurveyResponse.find(query).lean();

  if (!responses.length) {
    return {
      success: true,
      message: "No survey responses found for this organization and filters.",
      data: {
        unit: filters.unitDepartment ?? null,
        totalParticipants: 0,
        mentalHealthMetrics: [],
        ageStats: [],
        genderStats: [],
        departmentStats: [],
        ageDistribution: [],
        genderAgeMatrix: [],
      },
    };
  }

  // 4) containers (collect values to decide thresholds)
  const totalParticipants = responses.length;

  const domainStatsMap = new Map<
    string,
    { sumRisk: number; surveyCount: number; values: number[]; max: number; highRiskCount: number }
  >();

  const ageMap = new Map<string, { people: number; sumHighRiskCount: number; highRiskRespondentCount: number }>();
  const genderMap = new Map<string, { people: number; sumHighRiskCount: number; highRiskRespondentCount: number }>();
  const departmentMap = new Map<string, { people: number; sumHighRiskCount: number; highRiskRespondentCount: number }>();
  const genderAgeMap = new Map<string, { people: number; sumHighRiskCount: number }>(); // `${age}::${gender}`

  // 5) accumulate
  for (const resp of responses) {
    // domain risks
    for (const dr of (resp.domainRisks || [])) {
      const domainName = dr.domain;
      const riskCount = typeof dr.riskCount === "number" ? dr.riskCount : 0;

      if (!domainStatsMap.has(domainName)) {
        domainStatsMap.set(domainName, {
          sumRisk: 0,
          surveyCount: 0,
          values: [],
          max: Number.NEGATIVE_INFINITY,
          highRiskCount: 0,
        });
      }
      const bucket = domainStatsMap.get(domainName)!;
      bucket.sumRisk += riskCount;
      bucket.surveyCount += 1;
      bucket.values.push(riskCount);
      if (riskCount > bucket.max) bucket.max = riskCount;
    }

    // demographics
    const surveyHighRiskCount = typeof resp.highRiskCount === "number" ? resp.highRiskCount : 0;

    updateDemographicMap(ageMap, resp.user?.age || "unknown", surveyHighRiskCount);
    updateDemographicMap(genderMap, resp.user?.gender || "unknown", surveyHighRiskCount);
    updateDemographicMap(departmentMap, resp.user?.department || "unknown", surveyHighRiskCount);

    // gender x age
    const gaKey = `${resp.user?.age || "unknown"}::${resp.user?.gender || "unknown"}`;
    if (!genderAgeMap.has(gaKey)) genderAgeMap.set(gaKey, { people: 0, sumHighRiskCount: 0 });
    const ga = genderAgeMap.get(gaKey)!;
    ga.people += 1;
    ga.sumHighRiskCount += surveyHighRiskCount;
  }

  // 6) dynamic threshold + highRiskCount per domain
  for (const [domainName, bucket] of domainStatsMap.entries()) {
    const observedMax = bucket.max === Number.NEGATIVE_INFINITY ? 0 : bucket.max;
    const threshold = observedMax <= 5 ? SCORE5_HIGH_RISK_THRESHOLD : DOMAIN_HIGH_RISK_THRESHOLD;
    bucket.highRiskCount = bucket.values.filter(v => v > threshold).length;
  }

  // 7) mentalHealthMetrics (avgRisk float, riskPercent in %)
  const mentalHealthMetrics: any[] = [];
  for (const [domain, stats] of domainStatsMap.entries()) {
    const avgRiskRaw = stats.surveyCount ? (stats.sumRisk / stats.surveyCount) : 0;
    const avgRisk = Math.round(avgRiskRaw * 10) / 10; // 1 decimal float

    const riskPercentRaw = stats.surveyCount ? (stats.highRiskCount / stats.surveyCount) * 100 : 0;
    const riskPercent = Math.round(riskPercentRaw * 10) / 10; // 1 decimal percent

    let riskLevel = "high risk";
    if (avgRisk <= RISK_LEVEL.LOW_MAX) riskLevel = "low risk";
    else if (avgRisk <= RISK_LEVEL.MEDIUM_MAX) riskLevel = "medium risk";

    let satisfactionScore = 100 - avgRisk;
    satisfactionScore = clamp0100(satisfactionScore);
    const satisfactionRounded = Math.round(satisfactionScore * 10) / 10;

    mentalHealthMetrics.push({
      domain,
      avgRisk,                 // float (NOT %)
      riskPercent,             // percent (0..100)
      riskLevel,
      surveyCount: stats.surveyCount,
      highRiskCount: stats.highRiskCount,
      nonHighRiskCount: stats.surveyCount - stats.highRiskCount,
      satisfactionScore: satisfactionRounded,
    });
  }

  // 8) age/gender/department stats (unchanged logic; avg of personal highRiskCount)
  const ageStats: any[] = [];
  for (const [ageGroup, entry] of ageMap.entries()) {
    const people = entry.people;
    const peoplePercent = pct(people, totalParticipants);
    const riskScore = people ? Math.round((entry.sumHighRiskCount / people) * 10) / 10 : 0;
    const satisfactionScore = Math.round(clamp0100(100 - riskScore) * 10) / 10;

    ageStats.push({
      ageGroup,
      people,
      peoplePercent,
      riskScore,               // float (NOT %)
      satisfactionScore,
      surveyCount: people,
      highRiskCount: entry.highRiskRespondentCount,
      nonHighRiskCount: people - entry.highRiskRespondentCount,
    });
  }

  const genderStats: any[] = [];
  for (const [gender, entry] of genderMap.entries()) {
    const people = entry.people;
    const peoplePercent = pct(people, totalParticipants);
    const riskScore = people ? Math.round((entry.sumHighRiskCount / people) * 10) / 10 : 0;
    const satisfactionScore = Math.round(clamp0100(100 - riskScore) * 10) / 10;

    genderStats.push({
      gender,
      people,
      peoplePercent,
      riskScore,               // float (NOT %)
      satisfactionScore,
      surveyCount: people,
      highRiskCount: entry.highRiskRespondentCount,
      nonHighRiskCount: people - entry.highRiskRespondentCount,
    });
  }

  const departmentStats: any[] = [];
  for (const [department, entry] of departmentMap.entries()) {
    const people = entry.people;
    const departmentPercent = pct(people, totalParticipants);
    const avgRisk = people ? Math.round((entry.sumHighRiskCount / people) * 10) / 10 : 0;
    const satisfactionScore = Math.round(clamp0100(100 - avgRisk) * 10) / 10;

    departmentStats.push({
      department,
      totalResponses: people,
      departmentPercent,
      avgRisk,                 // float (NOT %)
      satisfactionScore,
      highRiskCount: entry.highRiskRespondentCount,
      nonHighRiskCount: people - entry.highRiskRespondentCount,
    });
  }

  // extras (if you need them in UI)
  const ageDistribution = ageStats.map(a => ({ ageGroup: a.ageGroup, sharePercent: a.peoplePercent }));
  const genderAgeMatrix: any[] = [];
  for (const [ageGroup, ageEntry] of ageMap.entries()) {
    const totalInAge = ageEntry.people || 0;
    const rows: any[] = [];
    for (const [gaKey, gaVal] of genderAgeMap.entries()) {
      const [a, g] = gaKey.split("::");
      if (a !== ageGroup) continue;
      const people = gaVal.people;
      const percentWithinAge = totalInAge ? Math.round(((people / totalInAge) * 100) * 10) / 10 : 0;
      const avgRiskRaw = people ? (gaVal.sumHighRiskCount / people) : 0;
      const wellbeingScore = Math.round(clamp0100(100 - avgRiskRaw) * 100) / 100;
      rows.push({ gender: g, people, percentWithinAge, wellbeingScore });
    }
    genderAgeMatrix.push({ ageGroup, rows });
  }

  return {
    success: true,
    message: "Organization survey statistics fetched successfully",
    data: {
      // unit: filters.unitDepartment ?? null,
      totalParticipants,
      mentalHealthMetrics,
      ageStats,
      genderStats,
      departmentStats,
      ageDistribution,
      genderAgeMatrix,
    },
  };
};







export const SurveyService = {
  startSurvey,
  submitAnswer,
  getSurveyResult,
  getAllServeysResult,
  getSingleOrganizationServays,
  getOrganizationSurveyStats
};
