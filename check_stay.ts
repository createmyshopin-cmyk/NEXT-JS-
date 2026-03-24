import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase URL or Key');

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: stay, error } = await supabase
    .from('stays')
    .select('*')
    .eq('stay_id', 'Stay-9691');
  
  if (error) {
    console.log('Error fetching stay:', error);
    return;
  }
  
  console.log('Stay fetched:', stay.length > 0 ? stay[0].id : 'Not found');
  
  if (stay && stay.length > 0) {
    const s = stay[0];
    const tenantId = s.tenant_id;
    console.log('Stay tenant info:', tenantId);
    
    if (tenantId) {
      const { data: tenant, error: tError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId);
        
      console.log('Tenant:', tenant?.[0]?.tenant_name, tError ? tError : '');
      
      const { data: tenantDomain, error: dError } = await supabase
        .from('tenant_domains')
        .select('*')
        .eq('tenant_id', tenantId);
        
      console.log('Domains:', tenantDomain?.map(d => `${d.subdomain} | ${d.custom_domain}`));
    }
  } else {
    // maybe check ignoring case or wildcards
    const { data: all } = await supabase.from('stays').select('stay_id, name, id').limit(5);
    console.log('Sample stays:', all);
  }
}
main();
