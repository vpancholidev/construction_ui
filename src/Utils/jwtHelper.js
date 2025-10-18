import { jwtDecode } from 'jwt-decode';

export const getUserFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);

    // try several common claim keys for organisation id
    const orgClaimKeys = ['organisationid', 'organisationId', 'orgId', 'organisation_id', 'org_id'];
    let organisationId = null;
    for (const k of orgClaimKeys) {
      if (decoded[k]) { organisationId = decoded[k]; break; }
    }
    // also check prefixed claim variations if present
    if (!organisationId) {
      organisationId = decoded['http://schemas.microsoft.com/identity/claims/organisationid'] || decoded['organisationId'] || null;
    }

    return {
      name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
      email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      organisationId: organisationId
    };
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};
