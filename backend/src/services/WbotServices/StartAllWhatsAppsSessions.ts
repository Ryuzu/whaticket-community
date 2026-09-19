import ListWhatsAppsService from "../WhatsappService/ListWhatsAppsService";
import { StartWhatsAppSession } from "./StartWhatsAppSession";

export const StartAllWhatsAppsSessions = async (): Promise<void> => {
  const whatsapps = await ListWhatsAppsService();
  await Promise.all(
    whatsapps.map(async whatsapp => {
      await StartWhatsAppSession(whatsapp);
    })
  );
};
