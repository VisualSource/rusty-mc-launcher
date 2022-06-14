import { useQuery } from 'react-query';
import { AnchorButton, Card, Elevation, Intent, Spinner } from '@blueprintjs/core';
import css from './news.module.sass';
import { InvokeNews } from '../../lib/invoke';

interface INews {
    article_count: number;
    article_grid: {
        articleLang: string;
        article_url: string;
        categories: string[];
        primary_category: string;
        publish_date: string;
        tags: string[];
        preferred_tile?: {
            image:{
                alt: string;
                content_type: string;
                imageURL: string;
            },
            sub_header: string,
            tile_size: string,
            title: string;
        }
        default_tile: {
            sub_header: string;
            tile_size: string;
            title: string;
            image: {
                alt?: string;
                content_type: string;
                imageURL: string;
            }
        }
    }[]
}

async function GetNews(): Promise<INews["article_grid"]> {
    const request = await InvokeNews();

    const data: INews = JSON.parse(request);

    return data.article_grid.filter(art=>(art.categories.length !== 0) && !art.categories.includes("Marketplace"));
}

export default function News(){
    const { data, isLoading, isError } = useQuery<INews["article_grid"]>("news",GetNews);

    if(isError) return (
        <main className={css.wait}>
            Failed to load news
        </main>
    )
    
    if(isLoading) return (
        <main className={css.wait}>
            <div className={css.loading}>
                <Spinner/> 
                <span>Loading</span>
            </div>
        </main>
    );
   
   return (
        <main className={css.news}>
            {data?.map((art,i)=>{
                const article = art?.preferred_tile ?? art.default_tile; 

                return (
                    <Card key={i} className={css.article_news} elevation={Elevation.TWO}>
                        <img src={`https://www.minecraft.net/${article.image.imageURL}`} alt={article.image?.alt ?? "Article"} />
                        <article>
                            <h2>{article.title}</h2>
                            <p>{article.sub_header}</p>
                            <AnchorButton target="_blank" intent={Intent.SUCCESS} text="Read More" href={`https://www.minecraft.net/${art.article_url}`}/>
                        </article>
                    </Card>
                );
            })}
        </main>
    );
}