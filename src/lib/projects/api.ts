import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { privateJson } from '@/lib/auth/http';
import { ProjectError } from './contracts';

export async function projectUser() {
  const client=await createClient();
  const {data:{user},error}=await client.auth.getUser();
  if (error || !user) throw new ProjectError(401,'sign_in_required','Sign in to use account projects. Your browser drafts are still here.');
  return {client,user};
}
export function projectFailure(error: unknown) {
  return error instanceof ProjectError ? privateJson({error:error.message,code:error.code},error.status)
    : privateJson({error:'Account storage is unavailable. Your current work is preserved; try again.',code:'storage_unavailable'},503);
}
