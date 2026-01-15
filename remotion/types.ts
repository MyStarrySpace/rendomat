export type PolicyWrappedRenderPolicy = {
  id: string;
  title: string;
  category: string;
  averageSupport: number;
};

export type PolicyWrappedRenderProps = {
  displayName: string;
  label: string;
  avgScore: number;
  scoreLabel?: string;
  policies: PolicyWrappedRenderPolicy[];
  urlText?: string;
};

export type CivicProfileRenderProps = {
  studentName: string;
  topPriorities: Array<{
    id: string;
    title: string;
  }>;
  quote: string;
  stats: {
    policiesExplored: number;
    discussionsJoined: number;
    positionsRevised: number;
  };
  urlText?: string;
};

export type ClassProfileRenderProps = {
  teacherName: string;
  className: string;
  topPolicies: Array<{
    id: string;
    title: string;
    studentCount: number;
  }>;
  stats: {
    totalStudents: number;
    positionsSubmitted: number;
    discussionPosts: number;
    positionsRevised: number;
  };
  urlText?: string;
};
