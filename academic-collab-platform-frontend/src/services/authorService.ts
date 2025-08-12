import axios from 'axios';

export const getAllAuthors = async () => {
  const res = await axios.get('/api/authors/search', { params: { size: 1000 } });
  return res.data.records.map((item: any) => item.name);
};

export const getAuthorDetail = async (authorName: string) => {
  const res = await axios.get('/api/authors/detail', { params: { name: authorName } });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.data;
};

export const getAllAuthorsWithId = async () => {
  const res = await axios.get('/api/authors/search', { params: { size: 1000 } });
  return res.data.records.map((item: any) => ({ id: item.id, name: item.name }));
}; 