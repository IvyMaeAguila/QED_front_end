import {useCallback} from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
import {useAdminReader} from '../../query/useAdminReader';
import {useAdminWriter} from '../../query/useAdminWriter';
import {useAdminFetch} from '../../query/useAdminFetch';
import {AdminSessionBoundary} from '../../query/AdminSessionBoundary';
import * as service from './services/academicyear.service';
import {AcademicYearPageComposition,type AcademicYearData} from './AcademicYearPage.loading-view';
export * from './AcademicYearPage.loading-view';
const yearKey=['academic-year','active'] as const;
const emptyTerms:service.TermRow[]=[];
function AcademicYearQueries(){
 const fetch=useAdminFetch(),year=useAdminReader(yearKey,service.fetchActiveAcademicYear,'Failed to load academic year.');
 const id=year.data?.id,terms=useAdminReader(['academic-year','terms',id??null],o=>service.fetchTerms(id!,o),'Failed to fetch terms.',!!id);
 const changed=useCallback((_data:unknown,_variables:unknown,key:readonly unknown[])=>{for(const resource of ['academic-year','subjects','class-options','templates','section-assignments','students','classes','student-options','dashboard'])void queryClient.invalidateQueries({queryKey:[...key,resource],refetchType:'none'});void queryClient.invalidateQueries({queryKey:[...key,'dashboard','audit'],refetchType:'none'});},[]);
 const addYear=useAdminWriter(service.addAcademicYear,changed);
 const saveTerms=useAdminWriter(({id,terms}:{id:number;terms:service.TermInput[]},o)=>service.saveTerms(id,terms,o),useCallback((saved:service.TermRow[],variables:{id:number},key:readonly unknown[])=>{queryClient.setQueryData([...key,'academic-year','terms',variables.id],saved);void queryClient.invalidateQueries({queryKey:[...key,...yearKey],refetchType:'none'});void queryClient.invalidateQueries({queryKey:[...key,'dashboard','audit'],refetchType:'none'});},[]));
 const data:AcademicYearData={academicYear:year.data??null,terms:terms.data??emptyTerms,loading:year.loading||!!id&&terms.loading,error:year.error??(id?terms.error:null),retry:async()=>{await year.retry();if(id)await terms.retry();},addYear,saveTerms:(id,terms)=>saveTerms({id,terms}),refreshYear:()=>fetch(yearKey,service.fetchActiveAcademicYear)};
 return <AcademicYearPageComposition data={data}/>;
}
export function AcademicYearPage(){return <AdminSessionBoundary resource="academic-year"><QueryClientProvider client={queryClient}><AcademicYearQueries/></QueryClientProvider></AdminSessionBoundary>;}
