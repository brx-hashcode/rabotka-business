import { BusinessBaseController } from "./base-controller";

/** The account holder is the one administrator; it invites the others. */
export type MemberRole = "ADMIN" | "RECRUITER" | "REVIEWER";
export type InvitedRole = Exclude<MemberRole, "ADMIN">;
export type MemberStatus = "INVITED" | "ACTIVE" | "REMOVED";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  isOwner: boolean;
  emailsOn: boolean;
  invitedAt: string | null;
  joinedAt: string | null;
  lastSeenAt: string | null;
};

/** Who is signed in: the holder or one of its team members. */
export type Me = TeamMember & { businessName: string };

export type Seats = { used: number; limit: number | null };
export type Team = { members: TeamMember[]; seats: Record<InvitedRole, Seats> };

export type ActivityItem = {
  id: string;
  at: string;
  /** `METHOD /route/:pattern`, as the API matched it. */
  action: string;
  targetId: string | null;
  member: { id: string; name: string; role: MemberRole } | null;
};
export type ActivityPage = { items: ActivityItem[]; page: number; total: number; hasMore: boolean };

/** `business/me/member`, `business/me/team`, `business/me/activity`. */
class TeamController extends BusinessBaseController {
  me(): Promise<Me> {
    return this.get("/business/me/member");
  }

  updateMe(body: { name?: string; emailsOn?: boolean }): Promise<Me> {
    return this.patch("/business/me/member", body);
  }

  team(): Promise<Team> {
    return this.get("/business/me/team");
  }

  invite(body: { email: string; name: string; role: InvitedRole }): Promise<TeamMember> {
    return this.post("/business/me/team", body);
  }

  resend(id: string): Promise<TeamMember> {
    return this.post(`/business/me/team/${encodeURIComponent(id)}/resend`);
  }

  setRole(id: string, role: InvitedRole): Promise<TeamMember> {
    return this.patch(`/business/me/team/${encodeURIComponent(id)}`, { role });
  }

  remove(id: string): Promise<{ removed: true }> {
    return this.delete(`/business/me/team/${encodeURIComponent(id)}`);
  }

  activity(params: { page?: number; memberId?: string } = {}): Promise<ActivityPage> {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.memberId) qs.set("memberId", params.memberId);
    return this.get(`/business/me/activity${qs.size ? `?${qs}` : ""}`);
  }
}

const controller = new TeamController();

export const meKey = ["business", "me", "member"] as const;
export const teamKey = ["business", "me", "team"] as const;
export const activityKey = ["business", "me", "activity"] as const;

export const getMe = controller.me.bind(controller);
export const updateMe = controller.updateMe.bind(controller);
export const getTeam = controller.team.bind(controller);
export const inviteMember = controller.invite.bind(controller);
export const resendInvite = controller.resend.bind(controller);
export const setMemberRole = controller.setRole.bind(controller);
export const removeMember = controller.remove.bind(controller);
export const getActivity = controller.activity.bind(controller);

export const ROLE_LABEL: Record<MemberRole, string> = {
  ADMIN: "Administrateur",
  RECRUITER: "Recruteur",
  REVIEWER: "Évaluateur",
};

export const ROLE_HINT: Record<MemberRole, string> = {
  ADMIN: "Tout, dont l'abonnement, l'organisation et l'équipe",
  RECRUITER: "Offres, candidats, entretiens, messages et missions",
  REVIEWER: "Consulte les candidats et donne son avis",
};
