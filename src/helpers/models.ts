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

export type TBaptism = {
  name: string;
  age: string;
  sex: string;
  date: Date;
  typeMember: string;
  ward: string;
}

export type TMissionary = {
  name: string;
  mission: string;
  begin: Date;
  end: Date;
  ward: string;
}

export type TTemple = {
  aggregateByMonth: (string)[];
  unityDetails: {
      unity: string;
      total: string;
      adult: string;
      young: string;
      rc: string;
      jas: string;
  }[];
}

export type TRecommendations = {
  ward: string;
  month: number;
  count: number;
}