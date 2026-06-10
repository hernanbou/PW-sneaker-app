import { registerLocaleData } from "@angular/common";
import localPt from "@angular/common/locales/pt";
import { bootstrapApplication } from "@angular/platform-browser";

import { App } from "./app/app"; 
import { appConfig } from "./app/app.config";

registerLocaleData(localPt);

bootstrapApplication(App, appConfig).catch((error) => {console.error(error)});