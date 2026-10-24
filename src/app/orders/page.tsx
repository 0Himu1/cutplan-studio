import type {Metadata} from 'next';
import {OrderTracking} from '@/components/commerce/order-tracking';
export const metadata:Metadata={title:'Orders'};
export default function Orders(){return <OrderTracking/>;}
