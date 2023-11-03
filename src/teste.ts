import{getDF} from './utils/similaritySrc'
//import {ask} from './old/exporttest'
import { queryMessage } from './utils/exporttest'
import { getDFcustomer } from './utils/similaritySrc'
//import {reviseTextWithGPT3} from './old/exporttest'
import {stringsRankedByRelatedness} from './utils/similaritySrc'
import { redisset } from './lib/redis'
import { CustomerChat } from './maisTeste'


export async function resChat(query:string){
let df = await getDF()
const message  = await queryMessage(query, df, 'gpt-3.5-turbo', 4096 - 500)
//console.log(message)
//let keys: any =(await redisset.keys('customer:+userteste4:chat:*'))||null
//const dfc = await getDFcustomer('customer:+userteste4:chat:')
//await queryMessage(query, dfc, 'gpt-3.5-turbo', 4096 - 500)
console.log(message)
return message
}
//resChat('EU tenho uma chamado aberto #sk-97392')


export async function codeHistory(message:string, customer:string) {
let  customerkey = customer
const dfc = await getDFcustomer(customerkey)
console.log(dfc)
const similarity = await stringsRankedByRelatedness(message, dfc, 1)
customerkey = customerkey+similarity[0][0]
console.log(customerkey)
return customerkey
}
//codeHistory('#sk-93177', 'customer:+userteste4:chat:' )

 export async function inatividade (){
    let customerChat: CustomerChat = {
        orderCode: '',
        chatAt: '',
        customer: {
            name: '',
            phone: ''
        },
        messages: []
    }
    const keys = await redisset.keys('customer:*')
    console.log(keys)
    for(const key of keys){
    customerChat = JSON.parse((await redisset.get(key))||'{}')
    let chatDate = new Date(customerChat.chatAt);
    // Data e hora atual
    const dataHoraAtual = new Date();
    // Calcule a diferença em milissegundos
    const diferencaEmMilissegundos = dataHoraAtual.getTime() - chatDate.getTime();
    // Calcule a diferença em minutos
    const diferencaEmMinutos = Math.floor(diferencaEmMilissegundos / (1000 * 1));
    // Verifique se a diferença em minutos é maior que 30
    if (diferencaEmMinutos > 1 && customerChat.status === 'open' ) {
       customerChat.status = 'closed'
        customerChat.messages.push({
            role: "assistant",
            content:  `atendimento encerrado por inatividade, o código do atendimento é: ${customerChat.orderCode}. Caso queira dar continuidade a este atendimento, digite este código para o atendente virtual. Desde já grato.`,})
            await redisset.set(key, JSON.stringify(customerChat))
            console.log('Status atualizado.');
    } else {
      console.log('Status não atualizado.');
      customerChat = customerChat
    }
}
return customerChat
}
