import { openai,} from '../lib/openai'
import {Redis} from 'ioredis';
import {stringsRankedByRelatedness} from '../utils/similaritySrc'
import { encode } from 'gpt-tokenizer/cjs/model/gpt-3.5-turbo';
import {redis, redisset} from '../lib/redis'



export async function getUserEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: [text],
  });
  return response.data[0].embedding
}

const redisClient = new Redis({
  host: '127.0.0.1',     // substitua pelo endereço IP ou nome de host do seu servidor Redis
  port: 6379,
  db:1,                // porta padrão do Redis
  password: '' // se o Redis estiver protegido por senha (opcional)
});
const GPT_MODEL = `gpt-3.5-turbo`;
////////////////////////////////////////////////////////////
export function numTokens(text: string, model: string): number {
    const encoding = encode(text)
    return encoding.length
}
////////////////////////////////////////////////
export interface data  {
    texto: string
    embedding: any[]
  } 

/////////////////////////////////////////////////////////

  export async function DataFrame (keys:string) {
    const keysREs = await redisset.keys(keys);
      const dataFrame: data[] = [];
      for (let i = 0; i < keys.length; i++) {
        const vet: string | null =await redisset.get(keysREs[i]) // Substitua pela função ou valor real
    
        if (vet !== null) {
            // O valor não é nulo, agora você pode usá-lo como uma string
            const response = JSON.parse(vet);
           
            dataFrame.push({
              texto: response.text,
              embedding: response.embedding,
            });
            
            // Faça o que quiser com 'stringValue'
        } else {
            // O valor é nulo, trate-o adequadamente
            console.log("O valor é nulo");
        }
      }
            return dataFrame
    }
///////////////////////////////////////////////////////
    export async function queryMessage(
        query: string,
        df: data[],
        model: string,
        tokenBudget: number,
      ): Promise<string> {
        // Suponha que você já possui funções como 'stringsRankedByRelatedness' e 'numTokens' definidas
        const strings: any[] = await stringsRankedByRelatedness(query, df, 2)
       
        const question: string = `\n\nQuestion: ${query}`;
        let message: string = ''
      
        for (const string of strings) {
          const nextArticle: string = `\n\nWikipedia article section:\n"""\n${string}\n"""`;
      
          if (numTokens(message + nextArticle + question, model) > tokenBudget) {
            break;
          } else {
            message += nextArticle;
          }
        }
        return message + question;
      }
/////////////////////////////////////////////////////////////////////
      export async function reviseTextWithGPT3(message: any, temp: number):Promise<string | undefined> {
        try {
            const gpt3Response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                temperature: temp,
                messages: message
            });
            //console.log('Resposta temporária de GPT-3:', gpt3Response)
            return gpt3Response.choices[0].message.content || undefined;
    
        } catch (err) {
            console.error('Erro ao revisar texto com GPT-3.5:', err);
            const erro = ('Erro ao revisar texto com GPT-3.5:')
            return erro ; // Em caso de erro, retorna o texto original
        }
    }

/////////////////////////////////////////////////////////////////////////////
    export async function ask(
        query: string,
        df: data[],
        model: string = GPT_MODEL,
        tokenBudget: number = 4096 - 500,
        printMessage: boolean = true
      ): Promise<string> {
        //const df = await DataFrame('ask:*')
        const message: string = await queryMessage(query, df, model, tokenBudget);
      
        if (printMessage) {
          //console.log(message);
        } 
        
        const messages = [  { role: 'assistant', content: 'Você é um assistente da Flowermind, responda apenas perguntas referentes a empresa, de respostas completas' },
                             { role: 'user', content: message },
                         ]
        // Suponha que você tenha uma função 'chatCompletionCreate' apropriada
        
        const responseMessage: any = await reviseTextWithGPT3(messages, 0) ;
        return responseMessage;
      }
/////////////////////////////////////////////////////////////////

const simulatedMessage: any = {
  id: 0, // Um ID único para a mensagem
  status: "open",
  body: 'Acho que este site está incorreto', // O corpo da mensagem
  from: '555499351529@c.us',
  type: 'chat', // O tipo da mensagem (pode ser 'chat', 'image', 'video', etc.)
  t: new Date().getTime(), // A data e hora da mensagem como timestamp
  notifyName: 'Nome do remetente simulado', // O nome do remetente
  // Outras propriedades que você deseja simular
  isGroupMsg: false, // Ou true, dependendo do cenário que deseja testar
};





/*(async () =>{
const keys2 = await redisset.keys(`customer:${simulatedMessage.from}:*`);
const chave = await redisset.get(`customer:${simulatedMessage.from}:chat ${keys2.length-1}`)
console.log(keys2.length)
console.log(keys2)
console.log(chave)
//customer:555499351529@c.us:chat 15
//console.log(keys2)
//console.log(customerKey+":"+(keys2.length -1))

//const lastChat = JSON.parse(await redisset.get(customerKey+":"+(keys2.length)) || "{}")
})()*/