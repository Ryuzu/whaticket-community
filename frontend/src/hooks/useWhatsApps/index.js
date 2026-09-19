import { useState, useEffect, useReducer } from "react";
import openSocket from "../../services/socket-io";
import toastError from "../../errors/toastError";

import api from "../../services/api";

const reducer = (state, action) => {
	if (action.type === "LOAD_WHATSAPPS") {
		const whatsApps = action.payload;

		return [...whatsApps];
	}

	if (action.type === "UPDATE_WHATSAPPS") {
		const whatsApp = action.payload;

		return state.some(item => item.id === whatsApp.id)
			? state.map(item => (item.id === whatsApp.id ? whatsApp : item))
			: [whatsApp, ...state];
	}

	if (action.type === "UPDATE_SESSION") {
		const whatsApp = action.payload;

		return state.map(item =>
			item.id === whatsApp.id ? { ...item, ...whatsApp } : item
		);
	}

	if (action.type === "DELETE_WHATSAPPS") {
		return state.filter(item => item.id !== action.payload);
	}

	if (action.type === "RESET") {
		return [];
	}

	return state;
};


const useWhatsApps = () => {
	const [whatsApps, dispatch] = useReducer(reducer, []);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		const fetchSession = async () => {
			try {
				const { data } = await api.get("/whatsapp/");
				dispatch({ type: "LOAD_WHATSAPPS", payload: data });
				setLoading(false);
			} catch (err) {
				setLoading(false);
				toastError(err);
			}
		};
		fetchSession();
	}, []);

	useEffect(() => {
		const socket = openSocket();

		socket.on("whatsapp", data => {
			if (data.action === "update") {
				dispatch({ type: "UPDATE_WHATSAPPS", payload: data.whatsapp });
			}
			if (data.action === "delete") {
				dispatch({ type: "DELETE_WHATSAPPS", payload: data.whatsappId });
			}
		});

		socket.on("whatsappSession", data => {
			if (data.action === "update") {
				dispatch({ type: "UPDATE_SESSION", payload: data.session });
			}
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	return { whatsApps, loading };
};

export default useWhatsApps;
