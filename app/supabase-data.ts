import type { User } from "@supabase/supabase-js";
import type { RomaCreceData } from "./audit-model";
import { supabase } from "./supabase";

type BusinessRow = RomaCreceData["business"] & { id: string };

export async function loadCloudData(user: User): Promise<RomaCreceData | null> {
  if (!supabase) return null;

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,name,category,city,objective,instagram")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<BusinessRow>();

  if (businessError) throw businessError;
  if (!business) return null;

  const [auditResponse, ideasResponse, plannerResponse] = await Promise.all([
    supabase
      .from("audit_snapshots")
      .select("score,answers,categories,recommendations,audited_at")
      .eq("business_id", business.id)
      .order("audited_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("content_ideas")
      .select("client_id,format,goal,title,hook,script,caption,hashtags,reason,potential,color,saved,created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("planned_content")
      .select("client_id,week_offset,day_index,publish_time,format,title,status,color")
      .eq("business_id", business.id),
  ]);

  if (auditResponse.error) throw auditResponse.error;
  if (ideasResponse.error) throw ideasResponse.error;
  if (plannerResponse.error) throw plannerResponse.error;
  if (!auditResponse.data) return null;

  return {
    business: {
      name: business.name,
      category: business.category,
      city: business.city,
      objective: business.objective,
      instagram: business.instagram,
    },
    answers: auditResponse.data.answers,
    audit: {
      score: auditResponse.data.score,
      categories: auditResponse.data.categories,
      recommendations: auditResponse.data.recommendations,
      createdAt: auditResponse.data.audited_at,
    },
    ideas: (ideasResponse.data ?? []).map((idea) => ({
      id: idea.client_id,
      format: idea.format,
      goal: idea.goal,
      title: idea.title,
      hook: idea.hook,
      script: idea.script,
      caption: idea.caption,
      hashtags: idea.hashtags,
      reason: idea.reason,
      score: idea.potential,
      color: idea.color,
      saved: idea.saved,
      createdAt: idea.created_at,
    })),
    plannedItems: (plannerResponse.data ?? []).map((item) => ({
      id: item.client_id,
      week: item.week_offset,
      day: item.day_index,
      time: item.publish_time,
      format: item.format,
      title: item.title,
      status: item.status,
      color: item.color,
    })),
  } as RomaCreceData;
}

export async function saveCloudData(user: User, data: RomaCreceData): Promise<void> {
  if (!supabase) return;

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .upsert({ owner_id: user.id, ...data.business, updated_at: new Date().toISOString() }, { onConflict: "owner_id,instagram" })
    .select("id")
    .single();

  if (businessError) throw businessError;
  const businessId = business.id;

  const { data: latestAudit, error: latestAuditError } = await supabase
    .from("audit_snapshots")
    .select("audited_at")
    .eq("business_id", businessId)
    .order("audited_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestAuditError) throw latestAuditError;
  if (latestAudit?.audited_at !== data.audit.createdAt) {
    const { error: auditError } = await supabase.from("audit_snapshots").insert({
      business_id: businessId,
      owner_id: user.id,
      score: data.audit.score,
      answers: data.answers,
      categories: data.audit.categories,
      recommendations: data.audit.recommendations,
      audited_at: data.audit.createdAt,
    });
    if (auditError) throw auditError;
  }

  const { error: deleteIdeasError } = await supabase.from("content_ideas").delete().eq("business_id", businessId);
  if (deleteIdeasError) throw deleteIdeasError;
  if (data.ideas?.length) {
    const { error } = await supabase.from("content_ideas").insert(data.ideas.map((idea) => ({
      business_id: businessId,
      owner_id: user.id,
      client_id: idea.id,
      format: idea.format,
      goal: idea.goal,
      title: idea.title,
      hook: idea.hook,
      script: idea.script,
      caption: idea.caption,
      hashtags: idea.hashtags,
      reason: idea.reason,
      potential: idea.score,
      color: idea.color,
      saved: idea.saved,
      created_at: idea.createdAt,
    })));
    if (error) throw error;
  }

  const { error: deletePlannerError } = await supabase.from("planned_content").delete().eq("business_id", businessId);
  if (deletePlannerError) throw deletePlannerError;
  if (data.plannedItems?.length) {
    const { error } = await supabase.from("planned_content").insert(data.plannedItems.map((item) => ({
      business_id: businessId,
      owner_id: user.id,
      client_id: item.id,
      week_offset: item.week ?? 0,
      day_index: item.day,
      publish_time: item.time,
      format: item.format,
      title: item.title,
      status: item.status,
      color: item.color,
    })));
    if (error) throw error;
  }
}
