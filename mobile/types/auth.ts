export interface LogInResponse {
  success: boolean;
  errorStatus: string;
}

export interface RequestParams {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: any;
}
