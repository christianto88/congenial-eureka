import { Request, ResponseToolkit } from "@hapi/hapi";
import * as shiftUsecase from "../../../usecases/shiftUsecase";
import { errorHandler } from "../../../shared/functions/error";
import {
  ICreateShift,
  IPublishShift,
  ISuccessResponse,
  IUpdateShift,
} from "../../../shared/interfaces";
import moduleLogger from "../../../shared/functions/logger";
import { Between, Equal, LessThan, MoreThanOrEqual } from "typeorm";
import { isBefore, lastDayOfWeek, startOfWeek } from "date-fns";

const logger = moduleLogger("shiftController");

const isWeekPublished = async (date: Date) => {
  const firstDay = startOfWeek(date, { weekStartsOn: 1 });
  const lastDay = lastDayOfWeek(date, { weekStartsOn: 1 });

  const shifts = await shiftUsecase.find({
    where: {
      date: Between(firstDay, lastDay),
    },
  });
  if (shifts && shifts.every((shift) => shift.isPublished === true)) {
    return true;
  }
  return false;
};

export const find = async (req: Request, h: ResponseToolkit) => {
  logger.info("Find shifts");
  try {
    const filter = req.query;
    if (filter.startDate && filter.endDate) {
      filter.where = {
        date: Between(new Date(filter.startDate), new Date(filter.endDate)),
      };
    }
    const data = await shiftUsecase.find(filter);
    const res: ISuccessResponse = {
      statusCode: 200,
      message: "Get shift successful",
      results: data,
    };
    return res;
  } catch (error) {
    logger.error(error.message);
    return errorHandler(h, error);
  }
};

export const findById = async (req: Request, h: ResponseToolkit) => {
  logger.info("Find shift by id");
  try {
    const id = req.params.id;
    const data = await shiftUsecase.findById(id);
    const res: ISuccessResponse = {
      statusCode: 200,
      message: "Get shift successful",
      results: data,
    };
    return res;
  } catch (error) {
    logger.error(error.message);
    return errorHandler(h, error);
  }
};

export const create = async (req: Request, h: ResponseToolkit) => {
  logger.info("Create shift");
  try {
    const body = req.payload as ICreateShift;
    if (
      isBefore(
        new Date(body.date).setHours(
          parseInt(body.endTime.split(":")[0]),
          parseInt(body.endTime.split(":")[1])
        ),
        new Date(body.date).setHours(
          parseInt(body.startTime.split(":")[0]),
          parseInt(body.startTime.split(":")[1])
        )
      )
    ) {
      throw new Error("End time must be greater than start time");
    }

    if (await isWeekPublished(new Date(body.date))) {
      throw new Error("Cannot create shift on published week");
    }

    const overlapping = await shiftUsecase.find({
      where: [
        {
          date: Equal(body.date),
          startTime: Equal(body.startTime),
          endTime: Equal(body.endTime),
        },
        {
          date: Equal(body.date),
          startTime: MoreThanOrEqual(body.startTime),
          endTime: LessThan(body.startTime),
        },
        {
          date: Equal(body.date),
          startTime: LessThan(body.endTime),
          endTime: MoreThanOrEqual(body.endTime),
        },
      ],
    });
    console.log("overlap", overlapping.length);
    if (overlapping.length > 0) {
      throw new Error("Overlapping schedule");
    }
    const data = await shiftUsecase.create(body);
    const res: ISuccessResponse = {
      statusCode: 200,
      message: "Create shift successful",
      results: data,
    };
    return res;
  } catch (error) {
    logger.error(error.message);
    return errorHandler(h, error);
  }
};

export const updateById = async (req: Request, h: ResponseToolkit) => {
  logger.info("Update shift by id");
  try {
    const id = req.params.id;
    const body = req.payload as IUpdateShift;
    const shift = await shiftUsecase.findById(id);
    if (!shift) {
      throw new Error("Shift not found");
    }
    if (shift.isPublished === true) {
      throw new Error("Cannot update published shift");
    }
    const data = await shiftUsecase.updateById(id, body);
    const res: ISuccessResponse = {
      statusCode: 200,
      message: "Update shift successful",
      results: data,
    };
    return res;
  } catch (error) {
    logger.error(error.message);
    return errorHandler(h, error);
  }
};

export const deleteById = async (req: Request, h: ResponseToolkit) => {
  logger.info("Delete shift by id");
  try {
    const id = req.params.id;
    const shift = await shiftUsecase.findById(id);
    if (!shift) {
      throw new Error("Shift not found");
    }
    if (shift.isPublished === true) {
      throw new Error("Cannot delete published shift");
    }
    const data = await shiftUsecase.deleteById(id);
    const res: ISuccessResponse = {
      statusCode: 200,
      message: "Delete shift successful",
      results: data,
    };
    return res;
  } catch (error) {
    logger.error(error.message);
    return errorHandler(h, error);
  }
};

export const publishShift = async (req: Request, h: ResponseToolkit) => {
  logger.info("Publish Shift");
  try {
    const id = req.params.id;
    const body = req.payload as IPublishShift;

    const data = await Promise.all(
      body.id.map((id: string) =>
        shiftUsecase.updateById(id, { isPublished: true })
      )
    );
    // const data = await shiftUsecase.publishShift(id);
    const res: ISuccessResponse = {
      statusCode: 200,
      message: "Published shift successful",
      results: data.filter(Boolean),
    };
    return res;
  } catch (error) {
    logger.error(error.message);
    return errorHandler(h, error);
  }
};
