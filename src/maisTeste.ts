import { Message, Whatsapp, create } from "venom-bot"
import { openai,} from './lib/openai'
import { redis, redisset } from "./lib/redis"
import{resChat} from './teste'
import {getUserEmbedding} from './utils/exporttest'
import { ChatCompletionMessage } from "openai/resources/chat"
import { initPrompt } from './utils/initPrompt'
import { getDFcustomer } from './utils/similaritySrc'



const simulatedMessage: any = {
    id: 0, // Um ID único para a mensagem
    status: "open",
    body: 'Ok, obrigado!', // O corpo da mensagem
    from: 'userteste4',
    type: 'chat', // O tipo da mensagem (pode ser 'chat', 'image', 'video', etc.)
    t: new Date().getTime(), // A data e hora da mensagem como timestamp
    notifyName: 'Nome do remetente simulado', // O nome do remetente
    // Outras propriedades que você deseja simular
    isGroupMsg: false, // Ou true, dependendo do cenário que deseja testar
};



// https://wa.me/+5512982754592
export interface CustomerChat {
  status?: "open" | "closed"
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
   


    let lastChat
    let orderCode = `#sk-${("00000" + Math.random()).slice(-5)}`
    customerKey = customerKey+orderCode
    let embedding = await getUserEmbedding(orderCode)

    
    for (const key of keys){
        let stat: any = await redisset.get(key)
        stat = JSON.parse(stat)
        if(stat.status === 'open'){
            lastChat = stat
            customerKey = key
            console.log(lastChat)
            break;
    }
}
        

    const customerChat: CustomerChat =
      lastChat?.status === "open"
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
      
      
     const content =
      (await completion(customerChat.messages)) || "Não entendi..."

      customerChat.messages.push({
        role: "assistant",
        content,})

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
