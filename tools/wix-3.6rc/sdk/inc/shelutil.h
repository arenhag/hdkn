#pragma once
//-------------------------------------------------------------------------------------------------
// <copyright file="shelutil.h" company="Microsoft">
//    Copyright (c) Microsoft Corporation.  All rights reserved.
//    
//    The use and distribution terms for this software are covered by the
//    Common Public License 1.0 (http://opensource.org/licenses/cpl1.0.php)
//    which can be found in the file CPL.TXT at the root of this distribution.
//    By using this software in any fashion, you are agreeing to be bound by
//    the terms of this license.
//    
//    You must not remove this notice, or any other, from this software.
// </copyright>
// 
// <summary>
//    Header for shell helper functions.
// </summary>
//-------------------------------------------------------------------------------------------------

#ifndef REFKNOWNFOLDERID
#define REFKNOWNFOLDERID REFGUID
#endif

#ifdef __cplusplus
extern "C" {
#endif

typedef BOOL (STDAPICALLTYPE *PFN_SHELLEXECUTEEXW)(
    __inout LPSHELLEXECUTEINFOW lpExecInfo
    );

void DAPI ShelFunctionOverride(
    __in_opt PFN_SHELLEXECUTEEXW pfnShellExecuteExW
    );
HRESULT DAPI ShelExec(
    __in_z LPCWSTR wzTargetPath,
    __in_opt LPCWSTR wzParameters,
    __in_opt LPCWSTR wzVerb,
    __in_opt LPCWSTR wzWorkingDirectory,
    __in int nShowCmd,
    __in_opt HWND hwndParent,
    __out_opt HANDLE* phProcess
    );
HRESULT DAPI ShelExecUnelevated(
    __in_z LPCWSTR wzTargetPath,
    __in_z_opt LPCWSTR wzParameters,
    __in_z_opt LPCWSTR wzVerb,
    __in_z_opt LPCWSTR wzWorkingDirectory,
    __in int nShowCmd
    );
HRESULT DAPI ShelGetFolder(
    __out_z LPWSTR* psczFolderPath,
    __in int csidlFolder
    );
HRESULT DAPI ShelGetKnownFolder(
    __out_z LPWSTR* psczFolderPath,
    __in REFKNOWNFOLDERID rfidFolder
    );

#ifdef __cplusplus
}
#endif
