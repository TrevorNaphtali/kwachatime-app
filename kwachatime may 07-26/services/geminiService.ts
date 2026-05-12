
import { GoogleGenAI, Type } from "@google/genai";
import { User, Loan } from "../types";

const getAI = () => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).process?.env?.API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};

export const generateAppIcon = async () => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A professional app icon for a Zambian money lending app named "KwachaTime". The design should feature a minimalist fusion of a modern clock face and a Zambian Kwacha symbol (a large "K"). Primary colors: deep emerald green (#064e3b) and vibrant orange (#f97316). The style should be vector-based, clean, and modern with a slight 3D depth, centered on a rounded square background.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Icon generation failed", error);
    return null;
  }
};

export const generateLoanStatusEmail = async (user: User, loan: Loan, status: string, reason?: string) => {
  try {
    const ai = getAI();
    const prompt = `
      Act as the Automated Communications Officer for KwachaTime Micro-Lending (Lusaka, Zambia).
      The current date is in the year 2026.
      Craft a professional email to a borrower regarding their loan status.
      Include Lender contact: +260977752428 and Email: ocmwila@networkit.info.
      Recipient Name: ${user.name}, Loan ID: ${loan.id}, Status: ${status}.
      Return ONLY JSON with "subject" and "body" (HTML).
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ["subject", "body"],
        },
      },
    });
    return JSON.parse(response.text || '{"subject": "Loan Update", "body": "Update on your loan."}');
  } catch (error) {
    return { subject: "Loan Update", body: "Your status has changed." };
  }
};

export const generateBorrowerReport = async (user: User) => {
  try {
    const ai = getAI();
    const prompt = `
      Generate a professional BORROWER CREDENTIAL REPORT (KYC Ledger) for management.
      The current year is 2026.
      
      LENDER INFO:
      - KwachaTime Micro-Lending Systems Ltd
      - Phone: +260977752428
      - Email: ocmwila@networkit.info
      
      DATA TO FORMAT:
      - Full Legal Name: ${user.name}
      - NRC/Passport Number: ${user.nrc}
      - Date of Birth: ${user.dob || 'Not Provided'}
      - Phone: ${user.phone}
      - Physical Address: ${user.address}
      - Employment Status: ${user.employment || 'Unemployed/Business'}
      - Income Source: ${user.incomeSource || 'N/A'}
      - Next of Kin Name: ${user.nextOfKinName}
      - Next of Kin Contact: ${user.nextOfKinPhone}
      - System ID: ${user.id}
      - Joined Date: ${new Date(user.joinedAt).toLocaleDateString()}
      - Report Generation Timestamp: ${new Date().toLocaleString()}
      
      Instructions:
      1. Create a clean, grid-based layout.
      2. Use a professional serif font for the body (Times New Roman).
      3. Add a footer stating: "Certified Internal Record 2026 - Republic of Zambia Micro-Lending Registry".
      
      Format: Formal Legal HTML.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "<p>Error generating credential report.</p>";
  }
};

export const generateLoanAgreement = async (user: User, loan: Loan) => {
  try {
    const ai = getAI();
    const prompt = `
      Generate a professional, legally binding LOAN AGREEMENT compliant with the Laws of the Republic of Zambia.
      DATED: Current Date in 2026.
      
      LENDER: KwachaTime Micro-Lending Systems Ltd (Lusaka Office).
      LENDER CONTACT: +260977752428
      LENDER EMAIL: ocmwila@networkit.info
      
      BORROWER DETAILS:
      - Name: ${user.name}
      - NRC/Passport: ${user.nrc}
      - DOB: ${user.dob}
      - Phone: ${user.phone}
      - Physical Address: ${user.address}
      - Employment: ${user.employment || 'N/A'}
      - Next of Kin: ${user.nextOfKinName} (${user.nextOfKinPhone})
      
      LOAN DETAILS:
      - Principal Amount: ZMW ${loan.principal}
      - Purpose: ${loan.purpose}
      - Tenure: ${loan.tenure}
      - Repayment Method: ${loan.repaymentMethod}
      - Due Date: ${new Date(loan.dueDate).toLocaleDateString()}
      - Collateral: ${loan.collateralDescription} (Serial: ${loan.collateralSerial || 'N/A'})
      - Submission Timestamp: ${new Date(loan.createdAt).toLocaleString()}
      
      REQUIRED SECTIONS:
      1. Definitions & Interpretations.
      2. Repayment Schedule & Interest Rates.
      3. Collateral Pledge & Security Interest.
      4. Default Clauses & Immediate Recovery Rights.
      5. Governing Law: Laws of the Republic of Zambia (Current 2026 Statutes).
      6. Execution Blocks: Spaces for Borrower, Lender, and 2 Witnesses.
      
      Format: Formal HTML with Times New Roman style fonts. Include a professional header.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "<p>Error generating agreement.</p>";
  }
};

export const generateLetterOfSale = async (user: User, loan: Loan) => {
  try {
    const ai = getAI();
    const prompt = `
      Generate a formal 'LETTER OF SALE AND IRREVOCABLE TRANSFER OF OWNERSHIP' for collateral in Zambia.
      DATED: 2026.
      
      SELLER (BORROWER): ${user.name}, NRC: ${user.nrc}, Address: ${user.address}.
      BUYER (LENDER): KwachaTime Micro-Lending Systems Ltd.
      BUYER CONTACT: +260977752428
      BUYER EMAIL: ocmwila@networkit.info
      
      COLLATERAL DESCRIPTION:
      - Item: ${loan.collateralDescription}
      - Serial Number: ${loan.collateralSerial || 'N/A'}
      - Condition: ${loan.collateralCondition || 'Standard'}
      - Current Location: ${loan.collateralLocation || 'Borrower Address'}
      - Submission Timestamp: ${new Date(loan.createdAt).toLocaleString()}
      
      LEGAL PROVISIONS:
      1. The Seller warrants that they are the sole and lawful owner of the item described.
      2. Ownership is irrevocably transferred to KwachaTime if the loan balance is not settled by ${new Date(loan.dueDate).toLocaleDateString()}.
      3. The Buyer is authorized to sell, auction, or retain the item to recover the debt upon default.
      4. Signature blocks for Seller, Buyer, and Commissioner for Oaths.
      
      Format: Formal Legal HTML.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "<p>Error generating sale letter.</p>";
  }
};

export const getOfficeDirections = async (userLat: number, userLng: number, mode: 'walking' | 'cycling' | 'driving') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Directions to 38 Alick Nkhata Rd, Lusaka from lat ${userLat}, lng ${userLng} for ${mode}.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: { latLng: { latitude: userLat, longitude: userLng } }
        }
      },
    });
    return { text: response.text, links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) {
    return { text: "Visit us at 38 Alick Nkhata Rd, Lusaka.", links: [] };
  }
};
