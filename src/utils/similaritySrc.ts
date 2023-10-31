import { openai,} from '../lib/openai'
import * as mlDistance from 'ml-distance';
import {Redis} from 'ioredis';
import { redisset } from '../lib/redis';


const redisClient = new Redis({
  host: '127.0.0.1',     // substitua pelo endereço IP ou nome de host do seu servidor Redis
  port: 6379,
  db:1,                // porta padrão do Redis
  password: '' // se o Redis estiver protegido por senha (opcional)
});



interface data  {
  texto: string
  embedding: any[]
} 
async function getEmbedding(query: string): Promise<number[]> {
  const queryEmbeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });
  const embedding = queryEmbeddingResponse.data[0].embedding;
  return embedding;
}
export async function stringsRankedByRelatedness(
  query: string,
  df: data[],
  topN: number
): Promise<[string, number][]> {
  const queryEmbedding = await getEmbedding(query);
  const stringsAndRelatednesses: [string, number][] = [];

  for (const row of df) {
    const relatedness = mlDistance.similarity.cosine(queryEmbedding, row.embedding);
    stringsAndRelatednesses.push([row.texto, relatedness]);
  }

  stringsAndRelatednesses.sort((a, b) => b[1] - a[1]);

  return stringsAndRelatednesses.slice(0, topN);
}

export async function getDF() {
  const keys = await redisset.keys('ask:*');
  const df: data[] = [];

  for (let i = 0; i < keys.length; i++) {
    const vet: string | null =await redisClient.get(keys[i]) // Substitua pela função ou valor real

    if (vet !== null) {
        // O valor não é nulo, agora você pode usá-lo como uma string
        const response = JSON.parse(vet);
       
        df.push({
          texto: response.text,
          embedding: response.embedding,
        });
        
        // Faça o que quiser com 'stringValue'
    } else {
        // O valor é nulo, trate-o adequadamente
        console.log("O valor é nulo");
    }
  }
 /* const query = "Como faço para atuaizar o email?"; // Sua consulta aqui
  const topStrings = await stringsRankedByRelatedness(query, df, 5);
    console.log(topStrings.length)
  for (let i = 0; i < topStrings.length; i++) {
    const [string, similarity] = topStrings[i];
    console.log([string, similarity]);
  }*/
   return df
}


export async function getDFcustomer(customer: string) {
  const keys = await redisset.keys(customer+'*');
  const df: data[] = [];

  for (let i = 0; i < keys.length; i++) {
    const vet: string | null =await redisset.get(keys[i]) // Substitua pela função ou valor real

    if (vet !== null) {
        // O valor não é nulo, agora você pode usá-lo como uma string
        const response = JSON.parse(vet);
       
        df.push({
          texto: response.orderCode,
          embedding: response.embedding,
        });
        
        // Faça o que quiser com 'stringValue'
    } else {
        // O valor é nulo, trate-o adequadamente
        console.log("O valor é nulo");
    }
  }
   return df
}