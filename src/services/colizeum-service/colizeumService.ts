import * as https from "https";
import axios from 'axios';

const http = axios.create({
  baseURL: 'https://colizeumarena.com/api/web',
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

export const getClubs = async () => {
  const {data} = await http.get('/club/all');
  return data;
};

export const getClub = async (tag: string) => {
  const {data} = await http.get(`/club/get?tag=${tag}`);
  return data;
};

export const getLocationsInfo = async () => {
  const {data} = await http.get('/key-value/locations');
  return data;
};