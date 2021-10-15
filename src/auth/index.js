import axios from 'axios'

export const fetchSnippetLogin = async ({ email, password }) => {
  const res = await axios.post("http://localhost:3050/api/authenticate", 
     { email, password },
     { headers: { "Content-Type": "application/json" }}
  );

  const { token, userId } = res.data

  process.env.FETCH_SNIPPET_TOKEN = token;
  process.env.FETCH_SNIPPET_USER_ID = userId;
};
