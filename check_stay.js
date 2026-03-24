const url = "https://rqnxtcigfauzzjaqxzut.supabase.co/rest/v1/stays?stay_id=eq.Stay-9691&select=*";
const key = "sb_publishable_xZb8SbBAfGzB9kygLeLqOQ_a8WYGQcE";

fetch(url, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`
  }
}).then(res => res.json()).then(async data => {
  console.log("Stays:", data.map(s => ({ id: s.id, stay_id: s.stay_id, tenant_id: s.tenant_id, status: s.status })));
  if (data[0] && data[0].tenant_id) {
    const pId = data[0].tenant_id;
    const tUrl = `https://rqnxtcigfauzzjaqxzut.supabase.co/rest/v1/tenants?id=eq.${pId}&select=*`;
    const tRes = await fetch(tUrl, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const tenants = await tRes.json();
    console.log("Tenant:", tenants);
    
    const dUrl = `https://rqnxtcigfauzzjaqxzut.supabase.co/rest/v1/tenant_domains?tenant_id=eq.${pId}&select=*`;
    const dRes = await fetch(dUrl, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const doms = await dRes.json();
    console.log("Domains:", doms.map(d => ({ subdomain: d.subdomain, custom_domain: d.custom_domain })));
  }
}).catch(console.error);
