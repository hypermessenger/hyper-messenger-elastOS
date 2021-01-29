import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class UIService {

    public avatarColors = ['#fe812c', '#6c4af2', '#e31a50', '#3980eb', '#2ca4be'];
    public theme = 'danger';

    constructor() {}

    getColor() {
        return this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)];
    }

    getInitials(name: string): string {
        const secondInitialIndex: number = name.indexOf(' ') + 1;
        if (secondInitialIndex) {
            return name.charAt(0) + name[secondInitialIndex].replace(/[^\w\s]/gi, '');
        }
        else {
            return name.charAt(0);
        }
    }
}
