// Retry only transient GET failures; permanent HTTP failures stay visible.
export async function downloadFetch(url,options,{fetcher=fetch,pause=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 for(let attempt=0;;attempt++){
  let response;
  try{response=await fetcher(url,options);}catch(error){if(attempt>=2)throw error;await pause(400*2**attempt);continue;}
  if(attempt>=2||![408,429,500,502,503,504].includes(response.status))return response;
  await response.body?.cancel();await pause(400*2**attempt);
 }
}
