import {createClient} from '@/lib/supabase/server';import type {PublicPlan} from './domain';
export async function getPublicPlans(){const client=await createClient();const {data,error}=await client.rpc('public_saas_plans' as never);if(error)return [] as PublicPlan[];return (data??[]) as PublicPlan[]}
