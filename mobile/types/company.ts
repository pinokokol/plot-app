export interface Company {
  id: number;
  name: string;
  abbreviation: string;
  headquarters: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country: {
      id: number;
      code: string;
      name: string;
    };
  };
  about: string;
  webPage: string;
  email: string;
  phone: string;
  mediaLinks: {};
  logo: {
    id: number;
    storageKey: string;
    name: string;
    contentType: string;
    size: number;
  };
  documents: Array<{
    id: number;
    type: string;
    category: string;
    description: string;
    document: {
      id: number;
      storageKey: string;
      name: string;
      contentType: string;
      size: number;
    };
  }>;
  certifications: Array<{
    type: string;
    certificate: {
      id: number;
      storageKey: string;
      name: string;
      contentType: string;
      size: number;
    };
    description: string;
    validity: string;
  }>;
  valueChains: Array<{
    id: number;
    name: string;
    description: string;
    valueChainStatus: string;
  }>;
  currency: {
    id: number;
    code: string;
    label: string;
    enabled: boolean;
  };
  actions: string[];
  users: Array<{
    id: number;
    email: string;
    name: string;
    surname: string;
    status: string;
    role: string;
    language: string;
    companyRole?: string;
  }>;
  companyRoles: string[];
  supportsCollectors: boolean;
}

export interface CompanyInfo {
  id: number;
  name: string;
  logo: string | null;
}
