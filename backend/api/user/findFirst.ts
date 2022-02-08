import { PrismaClient, wp_users, Prisma } from '@prisma/client';
import { saveLog, getStdErrMessage } from '../../utils';

const prisma = new PrismaClient();

type Body = {
  args: Prisma.wp_usersFindFirstArgs;
};

const handler: Backend.RequestHandler<void, Body, wp_users | null> = async (req, res) => {
  const { body } = req;
  const { args } = body;
  let result;
  try {
    result = await prisma.wp_users.findFirst(args);
  } catch (err) {
    saveLog({
      err,
      message: 'Error users findFirst',
      req,
    });
    return res.status(500).json({
      status: 'error',
      message: '',
      stdErrMessage: getStdErrMessage(err),
      data: null,
    });
  }
  if (result === null) {
    return res.status(404).json({
      status: 'warning',
      message: '',
      data: null,
    });
  }
  return res.status(200).json({
    status: 'success',
    message: '',
    data: result,
  });
};

export default handler;
