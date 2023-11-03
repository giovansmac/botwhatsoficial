import { Message, Whatsapp, create } from "venom-bot"
import { openai,} from './lib/openai'
import { redis, redisset } from "./lib/redis"
import{resChat} from './teste'
import {getUserEmbedding} from './utils/exporttest'
import { ChatCompletionMessage } from "openai/resources/chat"
import { initPrompt } from './utils/initPrompt'
import { getDFcustomer } from './utils/similaritySrc'
import{ codeHistory} from './teste'
import {inatividade} from './teste'



const simulatedMessage: any = {
    id: 0, // Um ID único para a mensagem
    status: "",
    body: 'Boa tarde, tudo certo?', // O corpo da mensagem
    from: 'userteste7',
    type: 'chat', // O tipo da mensagem (pode ser 'chat', 'image', 'video', etc.)
    t: new Date().getTime(), // A data e hora da mensagem como timestamp
    notifyName: 'Nome do remetente simulado', // O nome do remetente
    // Outras propriedades que você deseja simular
    isGroupMsg: false, // Ou true, dependendo do cenário que deseja testar
};

// https://wa.me/+5512982754592
export interface CustomerChat {
  status?: "open" | "closed"| "pending"| ""
  orderCode: string
  chatAt: string
  customer: {
    name: string
    phone: string
  }
  messages: ChatCompletionMessage []
  embedding?: number[]
}

export async function completion(
  messages: ChatCompletionMessage[]
): Promise<string | undefined> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", 
    temperature: 0,
    max_tokens: 256,
    messages,
  })
  console.log(completion.usage?.total_tokens)
  return completion.choices[0].message?.content || undefined
}


///tem que colocar essa função dentro do start client quando for subir pra produção
const tempoEmMilissegundos = 1 * 60 * 1000   
  setTimeout(async () => {
  const chat = await inatividade()
  if (chat.status != ""){
  console.debug(chat)
}
}, tempoEmMilissegundos);
////////////////

/*create({
  session: "food-gpt",
  disableWelcome: true,
})
  .then(async (client: Whatsapp) => await start(client))
  .catch((err) => {
    console.log(err)
  })*/

//async function start(client: Whatsapp) {
 
  //client.onMessage(async (message: Message) => {
    async function testeMessage(message: Message) {
      if (!message.body || message.isGroupMsg) return
      
    const customerPhone = `+${message.from.replace("@c.us", "")}`
    const customerName = message.author
    let customerKey = `customer:${customerPhone}:chat:`
    const keys = (await redisset.keys(customerKey+'*')|| null)
     

    let lastChat;
    let orderCode = `#sk-${("00000" + Math.random()).slice(-5)}`
    let embedding = await getUserEmbedding(orderCode)
    customerKey = customerKey+orderCode
    
    if (message.body.includes('#sk-')) {
      // Extrair o código do chamado do corpo da mensagem
      const codeMatch = message.body.match(/#sk-\d+/);
      
      if (codeMatch) {
        const customerCode = codeMatch[0]; // Obtém o código do chamado
        customerKey = customerKey+`${customerCode}`; // Crie a chave do histórico
        console.log(customerKey)
        // Verifique se há histórico para o código do chamado
        const chatHistory = await redisset.get(customerKey);
    
        if (chatHistory) {
          // Carregue o histórico da conversa
          lastChat = JSON.parse(chatHistory);
          // Defina o status do chat como "aberto"
          lastChat.status = 'pending';
          lastChat.orderCode = customerCode;
          await redisset.set(customerKey, JSON.stringify(lastChat))
          // Agora você pode trabalhar com o histórico da conversa
          console.log('Histórico da conversa:', lastChat);
        } else {
          console.log('Código de chamado não encontrado.');
        }
      }
    }else {
    for (const key of keys){
        let stat: any = await redisset.get(key)
        stat = JSON.parse(stat)
        if(stat.status === 'open' || stat.status === 'pending' ){
            stat.status = 'open'
            lastChat = stat
            customerKey = key
            console.log(lastChat)
            break;
      }
     }
    } 

    const customerChat: CustomerChat =
    (lastChat?.status === "open" || lastChat?.status === 'pending')
      ? (lastChat as CustomerChat)
        : {
            status: "open",
            orderCode,
            chatAt: new Date().toISOString(),
            customer: {
              name: customerName,
              phone: customerPhone,
            },
            messages: [
              {
                role: "system",
                content: initPrompt(orderCode),
              },
            ],
            embedding,
          }
          
    console.debug(customerPhone, "👤", message.body)

    let res = await resChat(message.body)

    customerChat.messages.push({
      role: "user",
      content: res},)
      
      
    let content =
      (await completion(customerChat.messages)) || "Não entendi..."

      customerChat.messages.push({
        role: "assistant",
        content,})

        content =
      (await completion(customerChat.messages)) || "Não entendi..."

        console.debug(customerPhone, "🤖", content)

    //await client.sendText(message.from, content)
  
    if (customerChat.status === "open" && content.includes(customerChat.orderCode)) {
        customerChat.status = "closed";
  
        console.debug(customerPhone, "📦", content)
        
        customerChat.embedding = embedding
      }

    redisset.set(customerKey, JSON.stringify(customerChat))
  }
  testeMessage(simulatedMessage)

//}
