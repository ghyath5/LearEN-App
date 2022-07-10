import { EventEmitter } from 'events';

const event = new EventEmitter();
type myEvents = 'hangup'
const on = (e: myEvents, callback:()=>void) => event.on(e, callback)
const off = (e: myEvents, callback:()=>void)=>event.off(e, callback)

const globalHangUp = ()=>{
    console.log('hannng');
    
    event.emit('hangup')
}

export {
    globalHangUp,
    on,
    off
}