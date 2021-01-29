import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
    providedIn: "root"
})
export class EventService {
    
    private topicMap = new Map<string, Subject<object>>();

    constructor() {
        //console.log("EventService - constructor");
    }

    init() {
        //console.log("EventService - init");
    }

    publishEvent(topic: string, data: object) {
        this.checkTopic(topic);
        this.topicMap.get(topic).next(data);
    }

    getObservable(topic: string) {
        this.checkTopic(topic);
        return this.topicMap.get(topic).asObservable();
    }

    checkTopic(topic: string) {
        if (!this.topicMap.has(topic)) {
            let subject = new Subject<object>();
            this.topicMap.set(topic, subject);
        }
    }
    
}