import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function main() {
  const { data: stay, error } = await supabase
    .from('stays')
    .select('*')
    .eq('stay_id', 'Stay-9691');
  
  console.log('Stay:', stay);
  console.log('Error:', error);

  if (stay && stay.length > 0) {
    const tenantId = stay[0].tenant_id;
    console.log('Fetching tenant info for:', tenantId);
    
    const { data: tenant, error: tError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId);
      
    console.log('Tenant:', tenant);
    console.log('TError:', tError);
    
    const { data: tenantDomain, error: dError } = await supabase
      .from('tenant_domains')
      .select('*')
      .eq('tenant_id', tenantId);
      
    console.log('Domains:', tenantDomain);
  } else {
    // maybe check ignoring case or wildcards
    const { data: all } = await supabase.from('stays').select('stay_id, name, id').limit(5);
    console.log('Sample stays:', all);
  }
}
main();
