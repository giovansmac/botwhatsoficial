import{getDF} from './utils/similaritySrc'
import {ask} from './utils/exporttest'
import { queryMessage } from './utils/exporttest'
import { getDFcustomer } from './utils/similaritySrc'
import {reviseTextWithGPT3} from './utils/exporttest'
import {stringsRankedByRelatedness} from './utils/similaritySrc'


export async function resChat(query:string){
let df = await getDF()
const message  = await queryMessage(query, df, 'gpt-3.5-turbo', 4096 - 500)
//console.log(message)
//let keys: any =(await redisset.keys('customer:+userteste4:chat:*'))||null
//const dfc = await getDFcustomer('customer:+userteste4:chat:')
//await queryMessage(query, dfc, 'gpt-3.5-turbo', 4096 - 500)
return message
}

//resChat('EU tenho uma chamado aberto #sk-97392')
/*export async function codeHistory(message:string, customer:string) {
let  customerkey = customer
const dfc = await getDFcustomer(customerkey)
console.log(dfc)
const similarity = await stringsRankedByRelatedness(message, dfc, 1)
customerkey = customerkey+similarity[0][0]
console.log(customerkey)
return customerkey
}*/
//codeHistory('#sk-93177', 'customer:+userteste4:chat:' )

