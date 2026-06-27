import Joi from "joi";

export const upsertCaseSchema = Joi.object({
  registrationDate: Joi.string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
    )
    .required(),
  courtName: Joi.string()
    .required(/^[0-9a-fA-F]{24}$/)
    .required(),
  caseNumber: Joi.string().required(),
  litigant: Joi.string().required(),
  litigantContact: Joi.string()
    .pattern(/^(?:(?:\+91|91)[-\s]*)?[6-9]\d{9}$/)
    .required(),
  particulars: Joi.string()
    .required(/^[0-9a-fA-F]{24}$/)
    .required(),
  year: Joi.string().required(),
  currentStage: Joi.string()
    .required(/^[0-9a-fA-F]{24}$/)
    .required(),
  previousDate: Joi.string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
    )
    .required(),
  nextDate: Joi.string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
    )
    .required(),
});

export const caseListing = Joi.object({
  fromDate: Joi.string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
    )
    .optional(),
  toDate: Joi.string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
    )
    .optional(),
});

export const getCaseInfo = Joi.object({
  caseId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
});

export const deleteCase = Joi.object({
  caseId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
});
