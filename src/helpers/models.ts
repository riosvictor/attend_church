type TWard = {
  name: string;
  code: string;
}

export type TAttendance = {
  ward: TWard;
  attendance: {
    month: string;
    days: {
      day?: string;
      attendance?: string;
    }[];
  }[];
}

export type TMissionary = {
  name?: string;
  mission?: string;
  begin?: Date;
  end?: Date;
  ward?: string;
}

export type TRecommendations = {
  ward: string;
  month: number;
  count: number;
}

export type TBaptisms = {
  ward: string;
  month: number;
  count: number;
}