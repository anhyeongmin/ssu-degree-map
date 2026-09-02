//! Browser-only graduation audit adapter derived from EATSTEAK/rusaint 0.16.3.
//! Network transport and cookies intentionally remain outside WASM.

use serde::{Deserialize, Deserializer, Serialize, de::{IntoDeserializer, value::MapDeserializer}};
use std::{borrow::Cow, collections::HashMap};
use url::Url;
use wasm_bindgen::prelude::*;
use wdpe::{
    body::{Body, BodyUpdate},
    command::{WebDynproCommandExecutor, element::{action::ButtonPressEventCommand, complex::SapTableBodyCommand, system::{ClientInspectorNotifyEventCommand, CustomClientInfoEventCommand, LoadingPlaceholderLoadEventCommand}, text::InputFieldValueCommand}},
    define_elements,
    element::{action::Button, complex::{SapTable, sap_table::FromSapTable}, definition::ElementDefinition, parser::ElementParser, system::{ClientInspector, Custom, CustomClientInfo, LoadingPlaceholder}, text::{InputField, InputFieldDef}, Element},
    error::{ElementError, WebDynproError},
    state::WebDynproState,
};

const APP_NAME: &str = "ZCMW8015";
const BASE_URL: &str = "https://ecc.ssu.ac.kr/sap/bc/webdynpro/SAP/";
const INITIAL_CLIENT_DATA_WD01: &str = "ClientWidth:1920px;ClientHeight:1000px;ScreenWidth:1920px;ScreenHeight:1080px;ScreenOrientation:landscape;ThemedTableRowHeight:33px;ThemedFormLayoutRowHeight:32px;ThemedSvgLibUrls:{\"SAPGUI-icons\":\"https://ecc.ssu.ac.kr:8443/sap/public/bc/ur/nw5/themes/~cache-20210223121230/Base/baseLib/sap_fiori_3/svg/libs/SAPGUI-icons.svg\",\"SAPWeb-icons\":\"https://ecc.ssu.ac.kr:8443/sap/public/bc/ur/nw5/themes/~cache-20210223121230/Base/baseLib/sap_fiori_3/svg/libs/SAPWeb-icons.svg\"};ThemeTags:Fiori_3,Touch;ThemeID:sap_fiori_3;SapThemeID:sap_fiori_3;DeviceType:DESKTOP";
const INITIAL_CLIENT_DATA_WD02: &str = "ThemedTableRowHeight:25px";

fn js_error(error: impl std::fmt::Display) -> JsValue { JsValue::from_str(&error.to_string()) }

trait InputFieldExt {
    fn value_string(&self) -> Result<String, WebDynproError>;
    fn value_into_u32(&self) -> Result<u32, WebDynproError>;
    fn value_into_f32(&self) -> Result<f32, WebDynproError>;
}

impl InputFieldExt for InputField<'_> {
    fn value_string(&self) -> Result<String, WebDynproError> {
        Ok(self.value().ok_or_else(|| ElementError::NoSuchContent {
            element:self.id().to_owned(), content:"value of InputField".to_owned(),
        })?.to_owned())
    }
    fn value_into_u32(&self) -> Result<u32, WebDynproError> {
        self.value_string()?.trim().parse().map_err(|error:std::num::ParseIntError| ElementError::InvalidContent {
            element:self.id().to_owned(), content:error.to_string(),
        }.into())
    }
    fn value_into_f32(&self) -> Result<f32, WebDynproError> {
        self.value_string()?.trim().parse().map_err(|error:std::num::ParseFloatError| ElementError::InvalidContent {
            element:self.id().to_owned(), content:error.to_string(),
        }.into())
    }
}

#[derive(Serialize)]
struct ProxyRequest { url: String, form: String }

#[derive(Serialize)]
struct AnonymousStudent {
    grade: u32,
    semester: u32,
    status: String,
    apply_year: u32,
    apply_type: String,
    department: String,
    majors: Vec<String>,
    audit_date: String,
    graduation_points: f32,
    completed_points: f32,
}

#[derive(Serialize)]
struct RequirementsOutput {
    is_graduatable: bool,
    requirements: HashMap<String, GraduationRequirement>,
}

// This data model and SAP table conversion follow rusaint's MIT-licensed
// graduation_requirements/model.rs, with direct identifiers intentionally omitted.
#[derive(Serialize, Deserialize, Debug)]
struct GraduationRequirement {
    #[serde(rename(deserialize = "졸업요건"), deserialize_with = "trimmed_string")]
    name: String,
    #[serde(rename(deserialize = "기준값"), deserialize_with = "optional_u32")]
    requirement: Option<u32>,
    #[serde(rename(deserialize = "계산값"), deserialize_with = "optional_f32")]
    calculation: Option<f32>,
    #[serde(rename(deserialize = "계산값 - 기준값"), deserialize_with = "optional_f32")]
    difference: Option<f32>,
    #[serde(rename(deserialize = "결과"), deserialize_with = "sufficiency")]
    result: bool,
    #[serde(rename(deserialize = "이수구분"))]
    category: String,
    #[serde(rename(deserialize = "과목사용"), deserialize_with = "lectures")]
    lectures: Vec<String>,
}

fn trimmed_string<'de, D: Deserializer<'de>>(deserializer: D) -> Result<String, D::Error> {
    Ok(String::deserialize(deserializer)?.trim().to_owned())
}
fn optional_u32<'de, D: Deserializer<'de>>(deserializer: D) -> Result<Option<u32>, D::Error> {
    let value = String::deserialize(deserializer)?;
    if value.trim().is_empty() { return Ok(None); }
    value.trim().parse().map(Some).map_err(serde::de::Error::custom)
}
fn optional_f32<'de, D: Deserializer<'de>>(deserializer: D) -> Result<Option<f32>, D::Error> {
    let value = String::deserialize(deserializer)?;
    if value.trim().is_empty() { return Ok(None); }
    value.trim().parse().map(Some).map_err(serde::de::Error::custom)
}
fn sufficiency<'de, D: Deserializer<'de>>(deserializer: D) -> Result<bool, D::Error> {
    Ok(String::deserialize(deserializer)?.trim() == "충족")
}
fn lectures<'de, D: Deserializer<'de>>(deserializer: D) -> Result<Vec<String>, D::Error> {
    Ok(String::deserialize(deserializer)?.split(", ").filter(|value| !value.trim().is_empty()).map(str::to_owned).collect())
}

impl<'body> FromSapTable<'body> for GraduationRequirement {
    fn from_table(
        header: Option<&'body wdpe::element::complex::sap_table::SapTableHeader>,
        row: &'body wdpe::element::complex::sap_table::SapTableRow,
        parser: &'body ElementParser,
    ) -> Result<Self, WebDynproError> {
        let values = row.try_row_into::<HashMap<String, String>>(header, parser)?;
        let map: MapDeserializer<_, serde::de::value::Error> = values.into_deserializer();
        GraduationRequirement::deserialize(map).map_err(|error| ElementError::InvalidContent {
            element:row.table_def().id().to_string(), content:error.to_string(),
        }.into())
    }
}

#[wasm_bindgen]
pub struct BrowserGraduationClient { state: WebDynproState }

impl<'a> BrowserGraduationClient {
    define_elements! {
        CLIENT_INSPECTOR_WD01: ClientInspector<'a> = "WD01";
        CLIENT_INSPECTOR_WD02: ClientInspector<'a> = "WD02";
        LOADING_PLACEHOLDER: LoadingPlaceholder<'a> = "_loadingPlaceholder_";
        STUDENT_GRADE: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_GRADE";
        PRCL: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_PRCL";
        STATUS: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_STATUST";
        APPLY_YEAR: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_APPLY_PERYR";
        NEWINCOR_CDT: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_NEWINCOR_CDT";
        CG_IDT_DEPT: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_CG_IDT_DEPT";
        CG_IDT1: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_CG_IDT1";
        CG_IDT2: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_CG_IDT2";
        CG_IDT3: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_CG_IDT3";
        CG_IDT4: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_CG_IDT4";
        AUDIT_DATE: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_AUDIT_DAT";
        GR_CPOP: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_GR_CPOP";
        COMP_CPOP: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_COMP_CPOP";
        AUDIT_RESULT: InputField<'a> = "ZCMW8015.ID_0001:MAIN.TC01_AUDIT_RESULT_T";
        SHOW_DETAILS: Button<'a> = "ZCMW8015.ID_0001:MAIN.BTN_DTL";
        MAIN_TABLE: SapTable<'a> = "ZCMW8015.ID_0001:MAIN.TABLE";
    }

    fn request(&self, events: String) -> Result<String, JsValue> {
        let client = self.state.body().ssr_client();
        let url = client.build_action_url(self.state.base_url()).map_err(js_error)?;
        let mut serializer = url::form_urlencoded::Serializer::new(String::new());
        serializer.append_pair("sap-charset", &client.charset);
        serializer.append_pair("sap-wd-secure-id", &client.wd_secure_id);
        serializer.append_pair("fesrAppName", &client.app_name);
        serializer.append_pair("fesrUseBeacon", if client.use_beacon { "true" } else { "false" });
        serializer.append_pair("SAPEVENTQUEUE", &events);
        serde_json::to_string(&ProxyRequest { url, form:serializer.finish() }).map_err(js_error)
    }
}

#[wasm_bindgen]
impl BrowserGraduationClient {
    #[wasm_bindgen(constructor)]
    pub fn new(raw_html: String) -> Result<BrowserGraduationClient, JsValue> {
        let body = Body::new(raw_html).map_err(js_error)?;
        let base_url = Url::parse(BASE_URL).map_err(js_error)?;
        Ok(Self { state:WebDynproState::new(base_url, APP_NAME.to_owned(), body) })
    }

    pub async fn initialization_request(&mut self) -> Result<String, JsValue> {
        let parser = ElementParser::new(self.state.body());
        let events = [
            parser.read(ClientInspectorNotifyEventCommand::new(Self::CLIENT_INSPECTOR_WD01, INITIAL_CLIENT_DATA_WD01)).map_err(js_error)?,
            parser.read(ClientInspectorNotifyEventCommand::new(Self::CLIENT_INSPECTOR_WD02, INITIAL_CLIENT_DATA_WD02)).map_err(js_error)?,
            parser.read(LoadingPlaceholderLoadEventCommand::new(Self::LOADING_PLACEHOLDER)).map_err(js_error)?,
            parser.read(CustomClientInfoEventCommand::new(Custom::new(Cow::Borrowed("WD01")), CustomClientInfo { client_url:self.state.client_url(), document_domain:"ssu.ac.kr".to_owned(), ..CustomClientInfo::default() })).map_err(js_error)?,
        ];
        for event in events { self.state.add_event(event).await; }
        let serialized = self.state.serialize_and_clear_with_form_event().await.map_err(js_error)?;
        self.request(serialized)
    }

    pub fn apply_update(&mut self, xml: String) -> Result<(), JsValue> {
        self.state.mutate_body(BodyUpdate::new(&xml).map_err(js_error)?).map_err(js_error)?;
        Ok(())
    }

    pub fn anonymous_student_json(&self) -> Result<String, JsValue> {
        let parser = ElementParser::new(self.state.body());
        let mut majors = Vec::new();
        let majors_definitions: [InputFieldDef; 4] = [Self::CG_IDT1, Self::CG_IDT2, Self::CG_IDT3, Self::CG_IDT4];
        for definition in &majors_definitions {
            let value = parser.element_from_def(definition).and_then(|field| field.value_string()).unwrap_or_default();
            if value.trim().is_empty() { break; }
            majors.push(value);
        }
        let student = AnonymousStudent {
            grade:parser.element_from_def(&Self::STUDENT_GRADE).map_err(js_error)?.value_into_u32().map_err(js_error)?,
            semester:parser.element_from_def(&Self::PRCL).map_err(js_error)?.value_into_u32().map_err(js_error)?,
            status:parser.element_from_def(&Self::STATUS).map_err(js_error)?.value_string().map_err(js_error)?,
            apply_year:parser.element_from_def(&Self::APPLY_YEAR).map_err(js_error)?.value_into_u32().map_err(js_error)?,
            apply_type:parser.element_from_def(&Self::NEWINCOR_CDT).map_err(js_error)?.value_string().map_err(js_error)?,
            department:parser.element_from_def(&Self::CG_IDT_DEPT).map_err(js_error)?.value_string().map_err(js_error)?,
            majors,
            audit_date:parser.element_from_def(&Self::AUDIT_DATE).map_err(js_error)?.value_string().map_err(js_error)?,
            graduation_points:parser.element_from_def(&Self::GR_CPOP).map_err(js_error)?.value_into_f32().map_err(js_error)?,
            completed_points:parser.element_from_def(&Self::COMP_CPOP).map_err(js_error)?.value_into_f32().map_err(js_error)?,
        };
        serde_json::to_string(&student).map_err(js_error)
    }

    pub async fn details_request(&mut self) -> Result<String, JsValue> {
        let event = ElementParser::new(self.state.body()).read(ButtonPressEventCommand::new(Self::SHOW_DETAILS)).map_err(js_error)?;
        self.state.add_event(event).await;
        let serialized = self.state.serialize_and_clear_with_form_event().await.map_err(js_error)?;
        self.request(serialized)
    }

    pub fn requirements_json(&self) -> Result<String, JsValue> {
        let parser = ElementParser::new(self.state.body());
        let is_graduatable = parser.read(InputFieldValueCommand::new(Self::AUDIT_RESULT)).is_ok_and(|value| value == "가능");
        let table = parser.read(SapTableBodyCommand::new(Self::MAIN_TABLE)).map_err(js_error)?;
        let requirements = table.try_table_into::<GraduationRequirement>(&parser).map_err(js_error)?.into_iter().map(|item| (item.name.clone(), item)).collect();
        serde_json::to_string(&RequirementsOutput { is_graduatable, requirements }).map_err(js_error)
    }
}

#[wasm_bindgen]
pub fn rusaint_parser_stack_probe() -> bool {
    std::mem::size_of::<wdpe::body::Body>() > 0 && std::mem::size_of::<ozra::types::DataSet>() > 0
}
