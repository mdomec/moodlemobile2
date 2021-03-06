// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Component, Input } from '@angular/core';

/**
 * Component to show an empty box message. It will show an optional icon or image and a text centered on page.
 *
 * Usage:
 * <core-empty-box *ngIf="empty" icon="bell" [message]="'core.emptymessage' | translate"></core-empty-box>
 */
@Component({
    selector: 'core-empty-box',
    templateUrl: 'core-empty-box.html'
})
export class CoreEmptyBoxComponent {
    @Input() message: string; // Message to display.
    @Input() icon?: string; // Name of the icon to use.
    @Input() image?: string; // Image source. If an icon is provided, image won't be used.

    constructor() {
        // Nothing to do.
    }
}
